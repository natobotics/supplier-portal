# Aprio — Supplier Invoice Portal

AI-enabled accounts payable portal. Benchmark: Bill.com, Tipalti, Ramp, Airbase.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

## Modules

| Page | Features |
|------|----------|
| **Dashboard** | Outstanding AP, overdue, pending approval, DPO, touchless rate KPIs · AP aging chart · 6-week cash-out forecast · AI insight cards · activity feed |
| **Invoices** | Status-tabbed table (review / exceptions / approval / scheduled / overdue / paid) · anomaly flags · bulk select · 3-way match badges |
| **Invoice detail** | AI extraction with per-field confidence · auto GL coding per line · 3-way match panel (invoice ↔ PO ↔ receipt) · multi-step approval timeline · early-pay discount card · fraud/duplicate/price-drift alerts |
| **Capture** | Drag-drop with simulated AI pipeline (read → extract → match → code → anomaly check) · email/EDI/portal intake channels · review queue sorted by confidence |
| **Approvals** | Pending queue with one-click approve/reject · amount-based routing policy ($10k/$100k thresholds) |
| **Payments** | Payment timing optimizer (discount capture vs cash, annualized return) · batch runs with dual-control release · fraud controls (bank-change freeze, positive pay, sanction screening) |
| **Suppliers** | Directory with W-9/bank verification status · risk levels · onboarding funnel · spend metrics |
| **Reports** | AP aging by supplier (bucketed per ASC 210 practice) · month-end accrual schedule · YTD spend by category · metric definitions |
| **AP Copilot** | Slide-over chat grounded in AP data — duplicates, due dates, fraud risk, discounts, DPO drivers, supplier concentration |

## AI enablement

Demo runs a deterministic local engine ([src/ai/copilot.ts](src/ai/copilot.ts)).
Production integration point for the Claude API (model `claude-fable-5`, tool-use
against the AP subledger, streaming) is documented in
[src/ai/anthropic.ts](src/ai/anthropic.ts) — proxy through a backend; never ship
the API key client-side.

AI surfaces throughout the product:

- **Extraction** — per-field confidence; <90% routes to human review
- **GL coding** — per-line suggested accounts with confidence bars
- **Anomaly detection** — duplicate invoices (amount + period window), price drift
  vs PO and trailing average, bank-change-before-payment (BEC pattern),
  new-supplier first invoice, round-amount heuristics
- **Payment optimizer** — early-pay discount vs cash position, annualized return
- **Copilot** — conversational analytics over invoices, suppliers, cash, risk

## Stack

Vite · React 18 · TypeScript · Tailwind CSS 4 · Recharts · Lucide icons.
Design system: Swiss/minimal, navy `#1E3A5F` primary, Inter + JetBrains Mono
(tabular figures for all money columns). Mock data in [src/data.ts](src/data.ts),
dates anchored to 2026-06-11.
