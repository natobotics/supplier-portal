# Aprio — Product Requirements Document

Version 1.0 · 2026-06-11 · Status: **approved scope, phased build**

## 1. Vision

AI-enabled accounts payable portal for a multi-entity recruitment and IT services
group. Suppliers (recruitment sub-contractors, freelance engineers, IT services
vendors) self-serve invoice submission against purchase orders; the company runs
a fixed 4-level approval chain, multi-currency payments across 10 entities, and
a monthly assurance close proving every supplier payment maps to a client PO.

**Business model context.** ~80% of spend is contract labor that is re-billed to
clients. A supplier invoice is therefore half of a margin pair: supplier cost ↔
client PO revenue. The product must close that loop, not just pay bills.

## 2. Entities

| Entity | Country | Functional currency | Tax regime notes |
|--------|---------|--------------------|------------------|
| NCons UK Ltd | United Kingdom | GBP | VAT, **IR35** off-payroll rules |
| NCons USA Inc | United States | USD | 1099/W-9, sales tax n/a on services |
| NCons GmbH | Germany | EUR | VAT, AÜG labor-leasing rules |
| NCons España SL | Spain | EUR | VAT |
| NCons Netherlands BV | Netherlands | EUR | VAT |
| NCons Poland Sp. z o.o. | Poland | PLN | VAT |
| NCons FZ-LLC | UAE (Dubai) | AED | VAT 5% |
| NCons India Pvt Ltd | India | INR | GST, TDS withholding |
| NCons Singapore Pte Ltd | Singapore | SGD | GST |
| NCons Sweden AB | Sweden | SEK | VAT |

Every supplier, PO, invoice, payment, budget and report carries an `entityId`.
Group-level views consolidate to GBP (reporting currency) at period-average or
closing rate as appropriate.

## 3. Users and roles

**External:** supplier admin (agency), freelancer (individual), supplier finance.
**Internal:** AP clerk/manager (per entity), HR approver, line manager, budget
owner, finance head (per entity), group CFO/CEO, auditor (read-only).

RBAC: role × entity scoping. A Germany finance head sees Germany; group roles
see all entities.

## 4. Approval policy (decided)

Fixed 4-level chain on **every invoice, any amount**:

1. **AP** — verification: extraction, duplicate/fraud, PO match
2. **HR** (sub-contractor) / **Line manager** (freelancer) / **Budget owner on
   the PO** (IT services)
3. **Finance head** of the owning entity
4. **CEO** — final, always

Rejection at any step returns the invoice to the supplier with reason. Full
audit trail per step. (Recorded recommendation, declined for now: auto-approve
step 3–4 for perfect PO+timesheet matches to reduce CEO queue load.)

## 5. Feature areas

### F1 — Core AP (shipped, Phase 1)
Capture (email/EDI/portal/upload) with AI extraction confidence, GL auto-coding,
3-way match (PO ↔ invoice ↔ timesheet/receipt), PO generator with NTE caps and
drawdown, supplier submission flow with live validation, fixed 4-level approvals
with role queues, payment batches with dual control, anomaly detection
(duplicate, rate drift, bank-change fraud, new supplier, PO overrun), AP copilot.

### F2 — Finance & compliance (FIRST PRIORITY — next build)

- **Multi-entity**: entity dimension everywhere; entity switcher in shell;
  per-entity and consolidated dashboards/reports.
- **Multi-currency**: invoice currency ≠ functional currency ≠ reporting
  currency. FX rate captured at booking and at payment; realized FX gain/loss
  on settlement; consolidated views in GBP.
- **Client PO mapping & monthly AP assurance** (from user notes): every
  supplier invoice links to a client PO / project. Month-end assurance report:
  % mapped, unmapped exceptions list, margin per engagement (client bill rate −
  supplier cost), and a sign-off checklist per entity ("all supplier APs taken
  care of and mapped").
- **IR35 (UK entity)**: engagement-level status determination (inside/outside),
  SDS document on file, expiry alerts; inside-IR35 invoices flagged for deemed
  payment handling and blocked from standard payment run until payroll
  processing confirmed. Equivalent placeholders for DE AÜG and IN TDS.
- **Credit notes & partial payments**: negative documents linked to original
  invoice; partial allocation against balance.
- **Recurring invoices**: retainer schedules auto-generate monthly drafts
  against their PO.

### F3 — Supplier experience
- **Onboarding wizard**: company/individual KYC, tax forms (W-9/W-8BEN, VAT/GST
  registration by entity), bank verification (penny test + out-of-band
  confirmation), contract/rate-card upload, progress tracker. Compliance gates
  payment eligibility.
- **Timesheet module**: weekly hour entry against PO → line-manager approval →
  approved timesheet auto-drafts the invoice (kills hour disputes; the approved
  timesheet IS the goods receipt).
- **Statements & remittance**: supplier self-serve balance, payment history,
  remittance advice PDFs.
- **Notifications**: email + in-app on every status change, both directions.

### F4 — Internal operations
- **Budget tracking**: per cost center × entity, committed (open POs) vs actual
  (invoiced) vs budget, burn alerts.
- **Contract repository**: MSAs, rate cards, SDS docs; expiry and rate-mismatch
  alerts (invoice rate vs contracted rate card).
- **Audit log viewer**: every state change, filterable, exportable.
- **User & role management**: invite, role × entity assignment, delegation
  windows (vacation cover for approvers).

### F5 — AI depth
- **Email-to-invoice ingest**: per-entity inbox (ap-uk@…, ap-de@…), Claude
  extraction → capture queue.
- **Contract term check**: invoice vs contract/rate card — rate, notice period,
  expenses policy violations surfaced as anomalies.
- **Cash flow forecast**: multi-currency outflow forecast by entity, FX
  exposure summary.
- **Copilot actions**: approve/hold/reject from chat with explicit confirmation;
  action audit-logged as the human approver.

### F6 — Integrations
- **Accounting** (adapter pattern, entity → ledger mapping): Xero, QuickBooks,
  FreeAgent, Odoo, Zoho Books. Sync: suppliers, invoices, payments, journals.
- **Slack / Teams**: approval requests as actionable messages.
- **Payment rails**: Wise Business / ACH for multi-currency batch payouts.
- **API + webhooks** for anything else.

## 6. Non-functional

- RBAC enforced server-side (row-level security); auditor role read-only.
- Full immutable audit trail (SOX-style control evidence).
- GDPR: contractor personal data across EU entities; data minimization;
  right-to-erasure workflow for offboarded suppliers.
- Demo track = frontend with mock data (current). Production track = Supabase
  (auth, Postgres, storage, RLS) + backend proxy for Claude API + email service.

## 7. Roadmap

| Phase | Scope | Track |
|-------|-------|-------|
| 1 ✅ | Core AP + PO generator + 4-level approvals + submission | demo |
| 2 ⏭ | **Finance & compliance**: multi-entity, multi-currency, client-PO mapping + monthly assurance, IR35, credit notes, recurring | demo |
| 3 | Supplier experience: onboarding, timesheets, statements, notifications | demo |
| 4 | Internal ops: budgets, contracts, audit log, user management | demo |
| 5 | AI depth: email ingest, term check, forecast, copilot actions | demo |
| 6 | Production hardening: Supabase, real auth/RLS, Claude API, then integrations (Xero first) | production |

## 8. Open questions

1. Reporting currency confirmed GBP? (assumed — group HQ is UK)
2. Client PO data source — manual entry now, CRM/ERP import later?
3. IR35: does the UK entity run deemed payments through its own payroll, or via
   umbrella companies? (changes the blocking rule)
4. Which accounting system is live per entity today? (drives integration order
   — Xero assumed first)
