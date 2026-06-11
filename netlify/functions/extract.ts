// Invoice extraction — Claude vision over an uploaded PDF/image.
//
// POST /.netlify/functions/extract
// body: { document_base64: string, media_type: 'application/pdf' | 'image/png' | 'image/jpeg',
//         entity_country: string }
// returns: structured extraction with per-field confidence + country compliance pre-check
//
// Uses structured outputs (output_config.format) — guaranteed schema-valid JSON.
// Note: claude-fable-5 does not support forced tool_choice; structured outputs
// are the supported way to constrain the response shape.

import type { Handler } from '@netlify/functions'

const MODEL = 'claude-fable-5'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    supplier_name: { type: 'string' },
    invoice_number: { type: 'string' },
    issue_date: { type: 'string', description: 'ISO date if printed, else empty string' },
    due_date: { type: 'string', description: 'ISO date if printed, else empty string' },
    currency: { type: 'string', description: 'ISO 4217' },
    total: { type: 'number' },
    po_reference: { type: 'string', description: 'PO number if printed, else empty string' },
    tax_id: { type: 'string', description: 'VAT/GST/TRN/GSTIN if printed, else empty string' },
    bank_account_hint: { type: 'string', description: 'last 4 digits of remit-to account, else empty string' },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          qty: { type: 'number' },
          unit_price: { type: 'number' },
          amount: { type: 'number' },
        },
        required: ['description', 'qty', 'unit_price', 'amount'],
      },
    },
    field_confidence: {
      type: 'array',
      description: 'confidence 0-1 per extracted field',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['field', 'confidence'],
      },
    },
    country_document_checks: {
      type: 'array',
      description:
        'Document-level mandates visible on the page for the processing country: sequential numbering, "Tax Invoice" label, HSN/SAC codes, reverse-charge wording.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          check: { type: 'string' },
          result: { type: 'string', enum: ['pass', 'fail', 'not_visible'] },
        },
        required: ['check', 'result'],
      },
    },
  },
  required: [
    'supplier_name', 'invoice_number', 'issue_date', 'due_date', 'currency',
    'total', 'po_reference', 'tax_id', 'bank_account_hint', 'lines',
    'field_confidence', 'country_document_checks',
  ],
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500, body: 'ANTHROPIC_API_KEY not configured' }

  const { document_base64, media_type, entity_country } = JSON.parse(event.body ?? '{}')
  if (!document_base64) return { statusCode: 400, body: 'document_base64 required' }

  const source =
    media_type === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type, data: document_base64 } }
      : { type: 'image', source: { type: 'base64', media_type, data: document_base64 } }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            source,
            {
              type: 'text',
              text: `Extract this supplier invoice. Processing entity country: ${entity_country}. Apply that country's document mandates in country_document_checks. Express uncertainty honestly in field_confidence — fields below 0.9 are routed to human review.`,
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) return { statusCode: res.status, body: await res.text() }
  const data = await res.json()
  const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '{}'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: text,
  }
}
