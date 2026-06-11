// Country compliance validation for uploaded invoices.
// Rules keyed by the PROCESSING entity's country. Checks marked `auto` are
// computed from invoice/supplier data; `registry` checks consult the tax
// registry below; the rest are document checks simulated for the demo and
// performed by Claude vision against the invoice PDF in production.

import type { Invoice, Supplier, Entity } from '../types'

export type CheckStatus = 'pass' | 'fail' | 'warn'

export interface ComplianceCheck {
  id: string
  label: string
  detail: string
  severity: 'required' | 'recommended'
  status: CheckStatus
}

// Supplier tax registrations (production: captured during onboarding).
const TAX_REGISTRY: Record<string, { kind: string; id: string } | undefined> = {
  'sup-01': { kind: 'VAT', id: 'GB 824 1175 33' },
  'sup-02': { kind: 'VAT', id: 'GB 442 8801 19' },
  'sup-03': { kind: 'USt-IdNr', id: 'DE 312 778 401' },
  'sup-04': undefined, // Cobalt — not registered yet
  'sup-05': { kind: 'VAT', id: 'GB 990 3321 07' },
  'sup-06': { kind: 'NIF-IVA', id: 'ES B-66554321' },
  'sup-07': { kind: 'USt-IdNr', id: 'DE 298 114 532' },
  'sup-08': { kind: 'GST', id: 'SG M9-0044121-8' },
  'sup-09': undefined, // Amara — registration pending
  'sup-10': { kind: 'EIN', id: '84-2210417' },
  'sup-11': { kind: 'VAT', id: 'GB 511 2098 44' },
  'sup-12': { kind: 'EIN', id: '47-8812930' },
}

interface RuleDef {
  id: string
  label: string
  detail: string
  severity: 'required' | 'recommended'
  evaluate: (inv: Invoice, sup: Supplier, ent: Entity) => CheckStatus
}

const lineSum = (inv: Invoice) => inv.lines.reduce((s, l) => s + l.amount, 0)

// Checks every country shares
const COMMON_RULES: RuleDef[] = [
  {
    id: 'number',
    label: 'Invoice number present',
    detail: 'A unique document number must appear on the invoice.',
    severity: 'required',
    evaluate: (inv) =>
      inv.extraction.some((f) => /invoice #|credit note #/i.test(f.field)) ? 'pass' : 'fail',
  },
  {
    id: 'dates',
    label: 'Issue date valid',
    detail: 'Issue date present and not after the due date.',
    severity: 'required',
    evaluate: (inv) => (inv.issueDate && inv.issueDate <= inv.dueDate ? 'pass' : 'fail'),
  },
  {
    id: 'totals',
    label: 'Line items reconcile to total',
    detail: 'Sum of line amounts must equal the invoice total (±0.01).',
    severity: 'required',
    evaluate: (inv) => (Math.abs(lineSum(inv) - inv.amount) < 0.01 ? 'pass' : 'fail'),
  },
  {
    id: 'supplier-identity',
    label: 'Supplier name and address on file',
    detail: 'Issuer identity must match the onboarded supplier record.',
    severity: 'required',
    evaluate: (inv) =>
      inv.extraction.some((f) => f.field === 'Supplier' && f.confidence >= 0.9) ? 'pass' : 'warn',
  },
  {
    id: 'bank-verified',
    label: 'Remit-to bank verified',
    detail: 'Payment details verified out-of-band during onboarding.',
    severity: 'required',
    evaluate: (_inv, sup) => (sup.bankVerified ? 'pass' : 'fail'),
  },
]

const taxIdRule = (kindLabel: string, detail: string): RuleDef => ({
  id: 'tax-id',
  label: `${kindLabel} on file`,
  detail,
  severity: 'required',
  evaluate: (_inv, sup) => (TAX_REGISTRY[sup.id] ? 'pass' : 'fail'),
})

const crossBorderVatRule: RuleDef = {
  id: 'reverse-charge',
  label: 'Cross-border VAT treatment stated',
  detail:
    'Foreign-supplier service invoices need reverse-charge wording (or proof VAT was correctly charged).',
  severity: 'required',
  evaluate: (inv, sup, ent) => {
    const crossBorder = sup.country !== ent.country.replace(/United Kingdom/, 'UK')
      && sup.country !== ent.country
    if (!crossBorder) return 'pass'
    // demo: EUR-billing foreign suppliers into UK flagged for manual confirmation
    return inv.currency !== ent.currency ? 'warn' : 'pass'
  },
}

// Country-specific document rules (beyond the common set)
const COUNTRY_RULES: Record<string, RuleDef[]> = {
  'United Kingdom': [
    taxIdRule('UK VAT registration', 'VAT-registered suppliers must show their VAT number (HMRC VAT Notice 700/21).'),
    crossBorderVatRule,
    {
      id: 'ir35-route',
      label: 'IR35 routing respected',
      detail: 'Inside-IR35 engagements must route via umbrella or payroll deemed payment.',
      severity: 'required',
      evaluate: (inv) => (inv.poId === 'po-05' || inv.poId === 'po-08' ? 'warn' : 'pass'),
    },
  ],
  Germany: [
    taxIdRule('USt-IdNr / Steuernummer', '§14 UStG requires the supplier tax number or VAT ID on every invoice.'),
    {
      id: 'sequential',
      label: 'Sequential invoice number (§14 UStG)',
      detail: 'German invoices must use a consecutive, unique numbering range.',
      severity: 'required',
      evaluate: () => 'pass',
    },
    {
      id: 'supply-date',
      label: 'Date of supply stated',
      detail: '§14 UStG requires the delivery/service date distinct from the issue date.',
      severity: 'recommended',
      evaluate: (inv) => (inv.timesheet ? 'pass' : 'warn'),
    },
  ],
  Spain: [
    taxIdRule('NIF / NIF-IVA', 'Spanish invoices require the issuer NIF; IVA breakdown per rate.'),
  ],
  Netherlands: [taxIdRule('BTW-nummer', 'Dutch invoices require the supplier BTW (VAT) number.')],
  Poland: [
    taxIdRule('NIP', 'Polish invoices require the supplier NIP.'),
    {
      id: 'ksef',
      label: 'KSeF structured e-invoice',
      detail: 'Poland mandates structured e-invoicing via KSeF — PDF-only invoices are non-compliant.',
      severity: 'required',
      evaluate: (inv) => (inv.source === 'edi' ? 'pass' : 'warn'),
    },
  ],
  'UAE (Dubai)': [
    taxIdRule('TRN', 'UAE tax invoices require the supplier Tax Registration Number.'),
    {
      id: 'tax-invoice-label',
      label: '"Tax Invoice" label present',
      detail: 'FTA requires the literal words “Tax Invoice” on the document.',
      severity: 'required',
      evaluate: () => 'pass',
    },
  ],
  India: [
    taxIdRule('GSTIN', 'Indian invoices require supplier and recipient GSTIN.'),
    {
      id: 'hsn-sac',
      label: 'HSN/SAC code per line',
      detail: 'GST invoices must classify each line with an HSN (goods) or SAC (services) code.',
      severity: 'required',
      evaluate: () => 'warn',
    },
    {
      id: 'tds',
      label: 'TDS withholding assessed',
      detail: 'Contractor payments may require tax deduction at source before settlement.',
      severity: 'recommended',
      evaluate: () => 'warn',
    },
  ],
  Singapore: [
    taxIdRule('GST registration', 'GST-registered suppliers must show their GST number; “Tax Invoice” label required above SGD 1,000.'),
  ],
  Sweden: [taxIdRule('Momsregistreringsnummer', 'Swedish invoices require the supplier VAT (moms) number.')],
  'United States': [
    {
      id: 'w9',
      label: 'W-9 / W-8 on file',
      detail: 'No federal invoice mandate, but a valid W-9 (or W-8 for foreign payees) is required before payment for 1099 reporting.',
      severity: 'required',
      evaluate: (_inv, sup) => (sup.taxFormStatus === 'verified' ? 'pass' : 'fail'),
    },
  ],
}

export function validateInvoice(inv: Invoice, sup: Supplier, ent: Entity): ComplianceCheck[] {
  const rules = [...COMMON_RULES, ...(COUNTRY_RULES[ent.country] ?? [])]
  return rules.map((r) => ({
    id: r.id,
    label: r.label,
    detail: r.detail,
    severity: r.severity,
    status: r.evaluate(inv, sup, ent),
  }))
}

export function complianceSummary(checks: ComplianceCheck[]) {
  const fails = checks.filter((c) => c.status === 'fail' && c.severity === 'required').length
  const warns = checks.filter((c) => c.status === 'warn').length
  return {
    fails,
    warns,
    verdict: (fails > 0 ? 'non_compliant' : warns > 0 ? 'review' : 'compliant') as
      | 'non_compliant'
      | 'review'
      | 'compliant',
  }
}

export const supplierTaxId = (supplierId: string) => TAX_REGISTRY[supplierId]
