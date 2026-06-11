-- NCONS Supplier Portal — production schema (Supabase / Postgres)
-- Apply with: supabase db push  (or paste into the SQL editor)
-- Mirrors src/types.ts; the frontend types are the source of truth.

create extension if not exists "uuid-ossp";

-- ---------- Core dimensions ----------

create table entities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  country     text not null,
  currency    char(3) not null,            -- functional currency (one per entity)
  tax_regime  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table suppliers (
  id              uuid primary key default uuid_generate_v4(),
  entity_id       uuid not null references entities(id),
  name            text not null,
  segment         text not null check (segment in ('subcontractor','freelancer','it_services')),
  category        text,
  contact_name    text,
  email           text not null,
  payment_terms   text,
  discount_terms  text,
  payment_method  text,
  currency        char(3) not null,        -- billing currency (may differ from entity)
  tax_form_status text not null default 'missing' check (tax_form_status in ('verified','pending','missing')),
  tax_registration jsonb,                  -- { kind: 'VAT', id: 'GB ...' }
  bank_verified   boolean not null default false,
  risk_level      text not null default 'medium' check (risk_level in ('low','medium','high')),
  onboarded_at    date,
  auth_user_id    uuid references auth.users(id),  -- supplier portal login
  created_at      timestamptz not null default now()
);

create table client_pos (
  id          uuid primary key default uuid_generate_v4(),
  entity_id   uuid not null references entities(id),
  number      text not null unique,
  client      text not null,
  engagement  text,
  currency    char(3) not null,
  value       numeric(14,2) not null,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now()
);

create table purchase_orders (
  id            uuid primary key default uuid_generate_v4(),
  entity_id     uuid not null references entities(id),
  supplier_id   uuid not null references suppliers(id),
  client_po_id  uuid references client_pos(id),
  number        text not null unique,
  title         text not null,
  budget_owner  text not null,
  cost_center   text not null,
  start_date    date,
  end_date      date,
  lines         jsonb not null default '[]',   -- [{description, rate, unit, qty, amount}]
  not_to_exceed numeric(14,2) not null,
  billed_to_date numeric(14,2) not null default 0,
  status        text not null default 'draft'
                check (status in ('draft','issued','partially_billed','fully_billed','closed')),
  ir35          jsonb,                          -- { status, route, sds_on_file, sds_expiry }
  created_at    timestamptz not null default now()
);

-- ---------- Documents ----------

create table invoices (
  id             uuid primary key default uuid_generate_v4(),
  entity_id      uuid not null references entities(id),
  supplier_id    uuid not null references suppliers(id),
  po_id          uuid references purchase_orders(id),
  client_po_id   uuid references client_pos(id),
  linked_invoice_id uuid references invoices(id),  -- credit notes
  number         text not null,
  doc_type       text not null default 'invoice' check (doc_type in ('invoice','credit_note')),
  cost_type      text not null default 'billable' check (cost_type in ('billable','internal')),
  issue_date     date not null,
  due_date       date not null,
  received_at    timestamptz not null default now(),
  amount         numeric(14,2) not null,
  currency       char(3) not null,
  fx_rate_gbp    numeric(12,6),                 -- locked at booking
  status         text not null default 'captured'
                 check (status in ('captured','review','exception','approval','scheduled','paid','rejected')),
  match_status   text not null default 'pending',
  source         text not null default 'portal' check (source in ('email','upload','edi','portal')),
  timesheet      jsonb,                          -- { period, hours, rate }
  lines          jsonb not null default '[]',
  extraction     jsonb not null default '[]',    -- AI fields with confidence
  anomalies      jsonb not null default '[]',
  discount       jsonb,
  document_path  text,                           -- storage bucket key (original PDF)
  paid_at        date,
  unique (supplier_id, number)                   -- duplicate guard at DB level
);

create table approvals (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  step        smallint not null check (step between 1 and 4),
  role        text not null,
  approver_id uuid references auth.users(id),
  approver    text not null,
  status      text not null default 'waiting' check (status in ('waiting','pending','approved','rejected')),
  comment     text,
  decided_at  timestamptz,
  unique (invoice_id, step)
);

create table timesheet_weeks (
  id          uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references suppliers(id),
  po_id       uuid not null references purchase_orders(id),
  entity_id   uuid not null references entities(id),
  week_start  date not null,
  hours       numeric(4,1)[] not null,           -- 7 entries Mon..Sun
  status      text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  approver    text,
  comment     text,
  invoice_id  uuid references invoices(id),
  submitted_at timestamptz,
  decided_at  timestamptz,
  unique (supplier_id, po_id, week_start)
);

create table contracts (
  id          uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references suppliers(id),
  type        text not null check (type in ('MSA','Rate card','SDS','SOW','NDA')),
  title       text not null,
  effective   date not null,
  expiry      date,
  status      text not null default 'active' check (status in ('active','expiring','expired','missing')),
  rate_card   jsonb,                              -- [{role, rate, unit, currency}]
  document_path text,
  note        text
);

-- ---------- Ops ----------

create table cost_center_budgets (
  id            uuid primary key default uuid_generate_v4(),
  cost_center   text not null unique,
  owner         text not null,
  fy_budget_gbp numeric(14,2) not null,
  note          text
);

create table profiles (
  id         uuid primary key references auth.users(id),
  name       text not null,
  role       text not null,
  entity_ids uuid[],                              -- null = all entities
  status     text not null default 'invited' check (status in ('active','invited','deactivated')),
  delegation jsonb                                -- { to, from, until }
);

create table audit_events (
  id      bigint generated always as identity primary key,
  ts      timestamptz not null default now(),
  actor   text not null,
  role    text,
  action  text not null,
  target  text not null,
  reason  text,
  kind    text not null check (kind in ('override','approval','edit','config','system'))
);

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  ts          timestamptz not null default now(),
  audience    text not null check (audience in ('internal','supplier')),
  supplier_id uuid references suppliers(id),
  title       text not null,
  body        text not null,
  kind        text not null,
  read        boolean not null default false
);

-- ---------- Row-level security ----------
-- Suppliers see only their own rows; internal users scope by entity; auditors read-only.

alter table invoices enable row level security;
alter table timesheet_weeks enable row level security;
alter table notifications enable row level security;
alter table suppliers enable row level security;

-- Supplier portal: a supplier auth user reads/writes only their own documents
create policy supplier_own_invoices on invoices
  for select using (
    supplier_id in (select id from suppliers where auth_user_id = auth.uid())
  );

create policy supplier_own_timesheets on timesheet_weeks
  for all using (
    supplier_id in (select id from suppliers where auth_user_id = auth.uid())
  );

create policy supplier_own_notifications on notifications
  for select using (
    audience = 'supplier'
    and supplier_id in (select id from suppliers where auth_user_id = auth.uid())
  );

-- Internal users: entity scoping via profiles.entity_ids (null = all)
create policy internal_invoices on invoices
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.status = 'active'
        and (p.entity_ids is null or invoices.entity_id = any (p.entity_ids))
    )
  );

-- Audit log: append-only — no update/delete policies are created on purpose.
alter table audit_events enable row level security;
create policy audit_read on audit_events for select using (auth.uid() is not null);
create policy audit_append on audit_events for insert with check (auth.uid() is not null);
