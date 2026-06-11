-- TEMPORARY demo-read policies — anonymous read access for the cutover phase.
-- Remove these when Supabase Auth ships (suppliers log in, internal users get
-- entity-scoped policies from schema.sql).
--
-- Paste into the Supabase SQL editor and run once.

alter table entities enable row level security;
drop policy if exists demo_read_entities on entities;
create policy demo_read_entities on entities for select using (true);

drop policy if exists demo_read_suppliers on suppliers;
create policy demo_read_suppliers on suppliers for select using (true);

drop policy if exists demo_read_invoices on invoices;
create policy demo_read_invoices on invoices for select using (true);

alter table approvals enable row level security;
drop policy if exists demo_read_approvals on approvals;
create policy demo_read_approvals on approvals for select using (true);

alter table purchase_orders enable row level security;
drop policy if exists demo_read_pos on purchase_orders;
create policy demo_read_pos on purchase_orders for select using (true);

alter table client_pos enable row level security;
drop policy if exists demo_read_client_pos on client_pos;
create policy demo_read_client_pos on client_pos for select using (true);
