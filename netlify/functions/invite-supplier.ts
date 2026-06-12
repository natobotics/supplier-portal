// Admin-driven supplier onboarding: creates the supplier profile row AND the
// portal login (Supabase Auth invite email) in one transaction-ish flow.
//
// POST /.netlify/functions/invite-supplier
// headers: Authorization: Bearer <caller's Supabase access token>
// body: { name, segment, category, contact_name, email, phone?, address?,
//         tax_id?, currency, entity_id, payment_terms?, payment_method? }
//
// Security: requires a valid authenticated session. Callers that are linked
// to a supplier row (suppliers.auth_user_id) are rejected — only internal
// users may invite. The service key never leaves this function.

import type { Handler } from '@netlify/functions'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

async function sb(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  return res
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  if (!SUPABASE_URL || !SERVICE_KEY)
    return { statusCode: 500, body: 'Supabase not configured' }

  // --- Authenticate the caller ---
  const token = (event.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return { statusCode: 401, body: 'Authentication required' }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return { statusCode: 401, body: 'Invalid session' }
  const caller = await userRes.json()

  // Suppliers cannot invite other suppliers.
  const callerSupplier = await sb(
    `/rest/v1/suppliers?auth_user_id=eq.${caller.id}&select=id&limit=1`,
  )
  const callerRows = await callerSupplier.json()
  if (Array.isArray(callerRows) && callerRows.length > 0)
    return { statusCode: 403, body: 'Only internal users can onboard suppliers' }

  // --- Validate input ---
  const b = JSON.parse(event.body ?? '{}')
  for (const field of ['name', 'segment', 'email', 'currency', 'entity_id']) {
    if (!b[field]) return { statusCode: 400, body: `${field} is required` }
  }
  if (!['subcontractor', 'freelancer', 'it_services'].includes(b.segment))
    return { statusCode: 400, body: 'invalid segment' }

  // --- 1. Create the supplier profile ---
  const supplierRes = await sb('/rest/v1/suppliers', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      entity_id: b.entity_id,
      name: b.name,
      segment: b.segment,
      category: b.category ?? null,
      contact_name: b.contact_name ?? null,
      email: b.email,
      currency: b.currency,
      payment_terms: b.payment_terms ?? 'Net 30',
      payment_method: b.payment_method ?? 'ACH',
      tax_form_status: 'pending',
      bank_verified: false,
      risk_level: 'medium',
      tax_registration: b.tax_id ? { kind: 'TAX', id: b.tax_id } : null,
      profile: {
        phone: b.phone ?? null,
        address: b.address ?? null,
        invited_by: caller.email,
        invited_at: new Date().toISOString(),
      },
    }),
  })
  if (!supplierRes.ok) {
    const detail = await supplierRes.text()
    return { statusCode: 422, body: `Could not create supplier profile: ${detail.slice(0, 300)}` }
  }
  const [supplier] = await supplierRes.json()

  // --- 2. Create the portal login + send the invite email ---
  const inviteRes = await sb('/auth/v1/invite', {
    method: 'POST',
    body: JSON.stringify({
      email: b.email,
      data: { supplier_id: supplier.id, supplier_name: b.name },
    }),
  })
  if (!inviteRes.ok) {
    const detail = await inviteRes.text()
    // Profile exists but no login — report clearly so the admin can retry.
    return {
      statusCode: 207,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        supplier_id: supplier.id,
        login_created: false,
        error: `Profile created, but the invite email failed: ${detail.slice(0, 200)}`,
      }),
    }
  }
  const invited = await inviteRes.json()

  // --- 3. Link the login to the profile ---
  await sb(`/rest/v1/suppliers?id=eq.${supplier.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ auth_user_id: invited.id }),
  })

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      supplier_id: supplier.id,
      auth_user_id: invited.id,
      login_created: true,
      invite_sent_to: b.email,
    }),
  }
}
