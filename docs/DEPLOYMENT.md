# Production deployment — NCONS Supplier Portal

Stack (decided 2026-06-11): **Supabase** (auth · Postgres · storage · RLS) +
**Netlify** (frontend · serverless Claude proxy) + **Claude API** (`claude-fable-5`).

## 1. Supabase

1. Create a project at supabase.com → note the project URL + anon key + service key.
2. Apply the schema: SQL editor → paste [supabase/schema.sql](../supabase/schema.sql) → run.
   (Or `supabase db push` with the CLI.)
3. Storage: create buckets `invoices` (private) and `contracts` (private).
4. Auth: enable email magic links. Internal users get rows in `profiles`
   (role + entity scope); supplier logins link via `suppliers.auth_user_id`.
5. Seed entities + internal users first; suppliers arrive via the onboarding flow.

## 2. Netlify

1. `netlify init` in the repo (or connect natobotics/supplier-portal in the UI).
   Build settings come from [netlify.toml](../netlify.toml).
2. Site settings → environment variables: copy [.env.example](../.env.example) —
   `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (functions only),
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend).
3. Deploy. PR previews are automatic.

## 3. Claude API

1. console.anthropic.com → API keys → create. Lives ONLY in Netlify env.
2. Functions already scaffolded:
   - `/.netlify/functions/extract` — Claude vision over uploaded PDFs: structured
     fields + per-field confidence + country document checks.
   - `/.netlify/functions/copilot` — chat proxy with AP tools (query invoices,
     PO balances, budget burn, approve-with-confirmation).
3. Remaining work marked `TODO(production)` in the functions: tool-use loop
   against Supabase with the caller's JWT, audit-log writes on actions.

## 4. Frontend cutover

Swap `src/data.ts` imports for a Supabase query layer with the same TypeScript
types (the schema mirrors `src/types.ts` deliberately). Recommended order:

1. Read-only: invoices, suppliers, POs, entities → portal renders live data.
2. Writes: timesheets, submissions, approvals (chain rows in `approvals` table).
3. Files: upload to `invoices` bucket → `extract` function → review queue.
4. Copilot → `/copilot` function (replace local engine in `src/ai/copilot.ts`).
5. Notifications: Supabase realtime on the `notifications` table + email via
   Resend/Postmark.

## 5. Accounting integrations (per entity, decided order)

| Order | System | Entities | Notes |
|-------|--------|----------|-------|
| 1 | FreeAgent | UK | Main entity, highest invoice volume |
| 2 | QuickBooks | USA | |
| 3 | Zoho Books / Odoo | India, UAE, others | Confirm per-entity split before build |

Adapter pattern: one `LedgerAdapter` interface (push suppliers, invoices,
payments, journals), one implementation per system.

## Controls carried into production

- RLS: suppliers see only their own rows; internal users scoped by entity;
  audit log append-only (no update/delete policy exists).
- API key never client-side; functions hold it.
- Bank-detail changes: 72h freeze + out-of-band verify (workflow rule, not UI-only).
- Fixed 4-level approval chain enforced in `approvals` table (steps 1–4 per invoice).
