-- Auth upgrade — run once in the Supabase SQL editor (after schema.sql).
-- Adds the supplier profile blob and the policies live auth needs.

-- Extended onboarding profile (phone, address, invited_by, …)
alter table suppliers add column if not exists profile jsonb;

-- A signed-in supplier must be able to find their own row (role resolution).
drop policy if exists supplier_own_row on suppliers;
create policy supplier_own_row on suppliers
  for select using (auth_user_id = auth.uid());

-- Authenticated internal users (not linked to any supplier row) read everything.
-- Demo-read policies from policies-demo.sql can be DROPPED once auth is live:
--   drop policy if exists demo_read_suppliers on suppliers;
--   drop policy if exists demo_read_invoices on invoices;
--   (… and the rest — see policies-demo.sql)
drop policy if exists internal_read_suppliers on suppliers;
create policy internal_read_suppliers on suppliers
  for select using (
    auth.uid() is not null
    and not exists (select 1 from suppliers s where s.auth_user_id = auth.uid())
  );

drop policy if exists internal_read_invoices on invoices;
create policy internal_read_invoices on invoices
  for select using (
    auth.uid() is not null
    and not exists (select 1 from suppliers s where s.auth_user_id = auth.uid())
  );

-- REQUIRED MANUAL STEP (dashboard, not SQL):
-- Authentication → URL Configuration → Site URL:
--   https://ncons-supplier-portal.netlify.app
-- so magic-link and invite emails redirect to the live portal.
