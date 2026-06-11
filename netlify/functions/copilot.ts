// AP Copilot — Claude proxy. The browser never sees the API key.
//
// POST /.netlify/functions/copilot
// body: { messages: [{ role: 'user'|'assistant', content: string }] }
//
// Env (Netlify site settings): ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

import type { Handler } from '@netlify/functions'

const MODEL = 'claude-fable-5'

const SYSTEM = `You are the NCONS AP Copilot — an accounts-payable analyst for a
multi-entity recruitment and IT services group (group reporting currency GBP).
Answer only from the tool results provided. Be precise and concise; quote
invoice numbers, amounts with currency, and dates. When asked to approve or
hold an invoice, never execute directly — restate the document, amount and
pending approver, surface any anomaly flags, and require the user to confirm.
All actions are audit-logged under the authenticated user.`

// Tools Claude can call — implemented against Supabase in production.
// Each handler should enforce the caller's RLS context (pass the user JWT
// through to Supabase rather than using the service key for reads).
const TOOLS = [
  {
    name: 'query_invoices',
    description: 'Search invoices by status, supplier, entity, due date range or free text.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        supplier: { type: 'string' },
        entity: { type: 'string' },
        due_before: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
  {
    name: 'get_po_balances',
    description: 'Open purchase orders with billed-to-date and remaining balance.',
    input_schema: { type: 'object', properties: { supplier: { type: 'string' } } },
  },
  {
    name: 'get_budget_burn',
    description: 'Cost-centre budgets with committed and actual spend in GBP.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'approve_invoice',
    description:
      'Approve the current pending step of an invoice. Only call after the user has explicitly confirmed.',
    input_schema: {
      type: 'object',
      properties: { invoice_number: { type: 'string' } },
      required: ['invoice_number'],
    },
  },
]

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500, body: 'ANTHROPIC_API_KEY not configured' }

  const { messages } = JSON.parse(event.body ?? '{}')
  if (!Array.isArray(messages) || messages.length === 0)
    return { statusCode: 400, body: 'messages[] required' }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return { statusCode: res.status, body: detail }
  }

  // TODO(production): loop on stop_reason === 'tool_use' — execute the tool
  // against Supabase (with the caller's JWT), append tool_result, re-call the
  // API until end_turn. approve_invoice additionally writes an audit_events row.
  const data = await res.json()
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  }
}
