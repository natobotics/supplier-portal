-- Auth upgrade — APPLIED to the live project on 2026-06-12 via migrations:
--   auth_upgrade_supplier_profiles_and_policies
--   fix_rls_recursion_with_security_definer
-- Kept here as the canonical record. Safe to re-run (idempotent).

-- Extended onboarding profile (phone, address, invited_by, …)
alter table suppliers add column if not exists profile jsonb;

-- Role lookup must bypass RLS — querying suppliers from within a suppliers
-- policy recurses (Postgres error 42P17). Security definer fixes it.
create or replace function public.is_supplier_user(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.suppliers where auth_user_id = uid)
$$;

revoke all on function public.is_supplier_user(uuid) from public;
grant execute on function public.is_supplier_user(uuid) to anon, authenticated;

-- A signed-in supplier can find their own row (role resolution).
drop policy if exists supplier_own_row on suppliers;
create policy supplier_own_row on suppliers
  for select using (auth_user_id = auth.uid());

-- Authenticated internal users (not linked to any supplier row) read everything.
drop policy if exists internal_read_suppliers on suppliers;
create policy internal_read_suppliers on suppliers
  for select using (
    auth.uid() is not null and not public.is_supplier_user(auth.uid())
  );

drop policy if exists internal_read_invoices on invoices;
create policy internal_read_invoices on invoices
  for select using (
    auth.uid() is not null and not public.is_supplier_user(auth.uid())
  );

-- Once auth is in regular use, drop the temporary anon demo-read policies:
--   drop policy if exists demo_read_suppliers on suppliers;
--   drop policy if exists demo_read_invoices on invoices;
--   drop policy if exists demo_read_entities on entities;
--   (… and the rest — see policies-demo.sql)

-- REQUIRED MANUAL STEP (dashboard, not SQL):
-- Authentication → URL Configuration → Site URL:
--   https://ncons-supplier-portal.netlify.app
-- so magic-link and invite emails redirect to the live portal.
