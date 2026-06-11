-- Demo seed — entities + suppliers (fixed UUIDs so re-runs are idempotent).
-- Run AFTER schema.sql. Invoices/POs seed in the next cutover step.

insert into entities (id, name, country, currency, tax_regime) values
  ('00000000-0000-4000-8000-000000000001','NCons UK Ltd','United Kingdom','GBP','VAT · IR35 off-payroll'),
  ('00000000-0000-4000-8000-000000000002','NCons USA Inc','United States','USD','1099 / W-9'),
  ('00000000-0000-4000-8000-000000000003','NCons GmbH','Germany','EUR','VAT · AÜG labor leasing'),
  ('00000000-0000-4000-8000-000000000004','NCons España SL','Spain','EUR','VAT'),
  ('00000000-0000-4000-8000-000000000005','NCons Netherlands BV','Netherlands','EUR','VAT'),
  ('00000000-0000-4000-8000-000000000006','NCons Poland Sp. z o.o.','Poland','PLN','VAT'),
  ('00000000-0000-4000-8000-000000000007','NCons FZ-LLC','UAE (Dubai)','AED','VAT 5%'),
  ('00000000-0000-4000-8000-000000000008','NCons India Pvt Ltd','India','INR','GST · TDS withholding'),
  ('00000000-0000-4000-8000-000000000009','NCons Singapore Pte Ltd','Singapore','SGD','GST'),
  ('00000000-0000-4000-8000-000000000010','NCons Sweden AB','Sweden','SEK','VAT')
on conflict (id) do nothing;

insert into suppliers (id, entity_id, name, segment, category, contact_name, email, payment_terms, discount_terms, payment_method, currency, tax_form_status, bank_verified, risk_level, onboarded_at) values
  ('00000000-0000-4000-9000-000000000001','00000000-0000-4000-8000-000000000001','TalentBridge Recruitment','subcontractor','Recruitment — Contract Placements','Dana Whitfield','billing@talentbridge.co.uk','Net 30','2/10 Net 30','ACH','GBP','verified',true,'low','2023-04-12'),
  ('00000000-0000-4000-9000-000000000002','00000000-0000-4000-8000-000000000001','PrimeStaff Solutions','subcontractor','Recruitment — Contract Placements','Marcus Lee','accounts@primestaff.io','Net 30',null,'ACH','GBP','verified',true,'low','2022-11-03'),
  ('00000000-0000-4000-9000-000000000003','00000000-0000-4000-8000-000000000001','Korva Talent Partners','subcontractor','Recruitment — Executive Search','Anneke Voss','invoices@korvatalent.com','Net 45',null,'Wire','EUR','verified',true,'medium','2024-02-14'),
  ('00000000-0000-4000-9000-000000000004','00000000-0000-4000-8000-000000000001','Cobalt Staffing Agency','subcontractor','Recruitment — Contract Placements','Maya Singh','payroll@cobaltstaffing.com','Net 15',null,'ACH','GBP','missing',true,'medium','2026-05-21'),
  ('00000000-0000-4000-9000-000000000005','00000000-0000-4000-8000-000000000001','Rajan Pillai','freelancer','Freelance — Network Engineer','Rajan Pillai','rajan@pillai.network','Net 15',null,'ACH','GBP','verified',true,'low','2024-06-30'),
  ('00000000-0000-4000-9000-000000000006','00000000-0000-4000-8000-000000000004','Elena Marquez','freelancer','Freelance — Cloud Engineer','Elena Marquez','elena@marquez.cloud','Net 15',null,'ACH','EUR','verified',true,'low','2025-01-20'),
  ('00000000-0000-4000-9000-000000000007','00000000-0000-4000-8000-000000000003','Tom Becker','freelancer','Freelance — DevOps Engineer','Tom Becker','tom@beckerops.dev','Net 15',null,'ACH','EUR','verified',true,'low','2023-09-18'),
  ('00000000-0000-4000-9000-000000000008','00000000-0000-4000-8000-000000000009','Yuki Tanaka','freelancer','Freelance — DC Smart Hands','Yuki Tanaka','yuki@tanakatech.jp','Net 15',null,'Wire','SGD','verified',true,'low','2025-08-11'),
  ('00000000-0000-4000-9000-000000000009','00000000-0000-4000-8000-000000000005','Amara Diallo','freelancer','Freelance — Security Engineer','Amara Diallo','amara@diallosec.com','Net 15',null,'ACH','EUR','pending',true,'medium','2026-04-02'),
  ('00000000-0000-4000-9000-000000000010','00000000-0000-4000-8000-000000000002','Helix Cloud Services','it_services','IT Services — Cloud & SaaS','Jenny Park','billing@helixcloud.io','Net 30',null,'Card','USD','verified',true,'low','2022-07-19'),
  ('00000000-0000-4000-9000-000000000011','00000000-0000-4000-8000-000000000001','SecureNet MSP','it_services','IT Services — Managed Security','Omar Haddad','finance@securenetmsp.com','Net 30','2/10 Net 30','ACH','GBP','verified',true,'low','2021-03-09'),
  ('00000000-0000-4000-9000-000000000012','00000000-0000-4000-8000-000000000002','Stellar IT Hardware','it_services','IT Services — Hardware','Gary Sutton','ar@stellarit.com','Net 30',null,'ACH','USD','verified',false,'high','2023-05-27')
on conflict (id) do nothing;
