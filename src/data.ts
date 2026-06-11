import type {
  Supplier, PurchaseOrder, Invoice, PaymentBatch, Activity, ApprovalStep,
  Entity, ClientPO, IR35Info, RecurringSchedule, AuditEvent, AdminConfig,
} from './types'
import { PEOPLE } from './types'

export const entities: Entity[] = [
  { id: 'ent-uk', name: 'NCons UK Ltd', country: 'United Kingdom', currency: 'GBP', taxRegime: 'VAT · IR35 off-payroll', active: true },
  { id: 'ent-us', name: 'NCons USA Inc', country: 'United States', currency: 'USD', taxRegime: '1099 / W-9', active: true },
  { id: 'ent-de', name: 'NCons GmbH', country: 'Germany', currency: 'EUR', taxRegime: 'VAT · AÜG labor leasing', active: true },
  { id: 'ent-es', name: 'NCons España SL', country: 'Spain', currency: 'EUR', taxRegime: 'VAT', active: true },
  { id: 'ent-nl', name: 'NCons Netherlands BV', country: 'Netherlands', currency: 'EUR', taxRegime: 'VAT', active: true },
  { id: 'ent-pl', name: 'NCons Poland Sp. z o.o.', country: 'Poland', currency: 'PLN', taxRegime: 'VAT', active: true },
  { id: 'ent-ae', name: 'NCons FZ-LLC', country: 'UAE (Dubai)', currency: 'AED', taxRegime: 'VAT 5%', active: true },
  { id: 'ent-in', name: 'NCons India Pvt Ltd', country: 'India', currency: 'INR', taxRegime: 'GST · TDS withholding', active: true },
  { id: 'ent-sg', name: 'NCons Singapore Pte Ltd', country: 'Singapore', currency: 'SGD', taxRegime: 'GST', active: true },
  { id: 'ent-se', name: 'NCons Sweden AB', country: 'Sweden', currency: 'SEK', taxRegime: 'VAT', active: true },
]

export const clientPOs: ClientPO[] = [
  { id: 'cpo-01', number: 'ACME-PO-2231', client: 'Acme Industrial', entityId: 'ent-uk', currency: 'GBP', value: 64000, engagement: 'Network ops support — Acme DC programme', status: 'open' },
  { id: 'cpo-02', number: 'GLX-4471', client: 'Globex AG', entityId: 'ent-de', currency: 'EUR', value: 78000, engagement: 'Platform engineering — Globex cloud', status: 'open' },
  { id: 'cpo-03', number: 'INI-2026-118', client: 'Initech LLC', entityId: 'ent-us', currency: 'USD', value: 96000, engagement: 'Managed infrastructure — Initech', status: 'open' },
  { id: 'cpo-04', number: 'ACME-PO-2240', client: 'Acme Industrial', entityId: 'ent-uk', currency: 'GBP', value: 120000, engagement: 'Recruitment ramp — Acme engineering hires', status: 'open' },
  { id: 'cpo-05', number: 'UMB-887', client: 'Umbra Retail Group', entityId: 'ent-es', currency: 'EUR', value: 41000, engagement: 'Cloud migration — Umbra', status: 'open' },
  { id: 'cpo-06', number: 'NRD-2026-09', client: 'Nordia Bank', entityId: 'ent-sg', currency: 'SGD', value: 30000, engagement: 'APAC smart hands — Nordia DCs', status: 'open' },
]

type SupplierRaw = Omit<Supplier, 'entityId' | 'currency'>
type PORaw = Omit<PurchaseOrder, 'entityId' | 'clientPoId' | 'ir35'>
type InvoiceRaw = Omit<Invoice, 'entityId' | 'docType' | 'costType' | 'clientPoId' | 'linkedInvoiceId'>

const suppliersRaw: SupplierRaw[] = [
  // ---- Sub-contractors (recruitment) ----
  {
    id: 'sup-01', name: 'TalentBridge Recruitment', segment: 'subcontractor', category: 'Recruitment — Contract Placements',
    contactName: 'Dana Whitfield', email: 'billing@talentbridge.co.uk',
    paymentTerms: 'Net 30', discountTerms: '2/10 Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2023-04-12', ytdSpend: 312400, openBalance: 78400, avgPayDays: 27, country: 'UK',
  },
  {
    id: 'sup-02', name: 'PrimeStaff Solutions', segment: 'subcontractor', category: 'Recruitment — Contract Placements',
    contactName: 'Marcus Lee', email: 'accounts@primestaff.io',
    paymentTerms: 'Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2022-11-03', ytdSpend: 186200, openBalance: 31040, avgPayDays: 29, country: 'UK',
  },
  {
    id: 'sup-03', name: 'Korva Talent Partners', segment: 'subcontractor', category: 'Recruitment — Executive Search',
    contactName: 'Anneke Voss', email: 'invoices@korvatalent.com',
    paymentTerms: 'Net 45', paymentMethod: 'Wire',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'medium',
    onboarded: '2024-02-14', ytdSpend: 96000, openBalance: 32000, avgPayDays: 41, country: 'DE',
  },
  {
    id: 'sup-04', name: 'Cobalt Staffing Agency', segment: 'subcontractor', category: 'Recruitment — Contract Placements',
    contactName: 'Maya Singh', email: 'payroll@cobaltstaffing.com',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'missing', bankVerified: true, riskLevel: 'medium',
    onboarded: '2026-05-21', ytdSpend: 18400, openBalance: 18400, avgPayDays: 0, country: 'UK',
  },
  // ---- Freelance engineers (smart hands) ----
  {
    id: 'sup-05', name: 'Rajan Pillai', segment: 'freelancer', category: 'Freelance — Network Engineer',
    contactName: 'Rajan Pillai', email: 'rajan@pillai.network',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2024-06-30', ytdSpend: 48450, openBalance: 15180, avgPayDays: 13, country: 'UK',
  },
  {
    id: 'sup-06', name: 'Elena Marquez', segment: 'freelancer', category: 'Freelance — Cloud Engineer',
    contactName: 'Elena Marquez', email: 'elena@marquez.cloud',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2025-01-20', ytdSpend: 39600, openBalance: 9460, avgPayDays: 14, country: 'ES',
  },
  {
    id: 'sup-07', name: 'Tom Becker', segment: 'freelancer', category: 'Freelance — DevOps Engineer',
    contactName: 'Tom Becker', email: 'tom@beckerops.dev',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2023-09-18', ytdSpend: 64600, openBalance: 22800, avgPayDays: 12, country: 'DE',
  },
  {
    id: 'sup-08', name: 'Yuki Tanaka', segment: 'freelancer', category: 'Freelance — DC Smart Hands',
    contactName: 'Yuki Tanaka', email: 'yuki@tanakatech.jp',
    paymentTerms: 'Net 15', paymentMethod: 'Wire',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2025-08-11', ytdSpend: 21120, openBalance: 7040, avgPayDays: 15, country: 'JP',
  },
  {
    id: 'sup-09', name: 'Amara Diallo', segment: 'freelancer', category: 'Freelance — Security Engineer',
    contactName: 'Amara Diallo', email: 'amara@diallosec.com',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'pending', bankVerified: true, riskLevel: 'medium',
    onboarded: '2026-04-02', ytdSpend: 12800, openBalance: 6400, avgPayDays: 16, country: 'FR',
  },
  // ---- IT services suppliers ----
  {
    id: 'sup-10', name: 'Helix Cloud Services', segment: 'it_services', category: 'IT Services — Cloud & SaaS',
    contactName: 'Jenny Park', email: 'billing@helixcloud.io',
    paymentTerms: 'Net 30', paymentMethod: 'Card',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2022-07-19', ytdSpend: 162600, openBalance: 27100, avgPayDays: 24, country: 'US',
  },
  {
    id: 'sup-11', name: 'SecureNet MSP', segment: 'it_services', category: 'IT Services — Managed Security',
    contactName: 'Omar Haddad', email: 'finance@securenetmsp.com',
    paymentTerms: 'Net 30', discountTerms: '2/10 Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2021-03-09', ytdSpend: 142800, openBalance: 16800, avgPayDays: 26, country: 'UK',
  },
  {
    id: 'sup-12', name: 'Stellar IT Hardware', segment: 'it_services', category: 'IT Services — Hardware',
    contactName: 'Gary Sutton', email: 'ar@stellarit.com',
    paymentTerms: 'Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: false, riskLevel: 'high',
    onboarded: '2023-05-27', ytdSpend: 118500, openBalance: 23150, avgPayDays: 31, country: 'US',
  },
]

// entity + billing currency per supplier
const SUPPLIER_META: Record<string, { entityId: string; currency: string }> = {
  'sup-01': { entityId: 'ent-uk', currency: 'GBP' },
  'sup-02': { entityId: 'ent-uk', currency: 'GBP' },
  // Korva (German exec-search firm) bills the UK entity in EUR —
  // demonstrates multiple transaction currencies inside one entity.
  'sup-03': { entityId: 'ent-uk', currency: 'EUR' },
  'sup-04': { entityId: 'ent-uk', currency: 'GBP' },
  'sup-05': { entityId: 'ent-uk', currency: 'GBP' },
  'sup-06': { entityId: 'ent-es', currency: 'EUR' },
  'sup-07': { entityId: 'ent-de', currency: 'EUR' },
  'sup-08': { entityId: 'ent-sg', currency: 'SGD' },
  'sup-09': { entityId: 'ent-nl', currency: 'EUR' },
  'sup-10': { entityId: 'ent-us', currency: 'USD' },
  'sup-11': { entityId: 'ent-uk', currency: 'GBP' },
  'sup-12': { entityId: 'ent-us', currency: 'USD' },
}

export const suppliers: Supplier[] = suppliersRaw.map((s) => ({
  ...s,
  ...SUPPLIER_META[s.id],
}))

// IR35 / client-PO linkage per purchase order
const PO_META: Record<string, { clientPoId?: string; ir35?: IR35Info }> = {
  'po-01': { clientPoId: 'cpo-01', ir35: { status: 'outside', sdsOnFile: true, sdsExpiry: '2026-12-31', note: 'SDS reviewed Apr 2026 — genuine substitution clause exercised once.' } },
  'po-02': { clientPoId: 'cpo-05', ir35: { status: 'not_applicable', sdsOnFile: false, note: 'Spain engagement — IR35 not applicable. AÜG-equivalent check n/a.' } },
  'po-03': { clientPoId: 'cpo-02', ir35: { status: 'not_applicable', sdsOnFile: false, note: 'Germany engagement — monitor AÜG labor-leasing exposure instead.' } },
  'po-04': { clientPoId: 'cpo-06', ir35: { status: 'not_applicable', sdsOnFile: false, note: 'Singapore engagement.' } },
  'po-05': { clientPoId: 'cpo-04', ir35: { status: 'inside', route: 'payroll', sdsOnFile: true, sdsExpiry: '2026-09-30', note: 'Placed recruiters deemed inside — payments route via UK payroll deemed-payment run.' } },
  'po-06': { clientPoId: 'cpo-03' },
  'po-07': {},
  'po-08': { clientPoId: 'cpo-01', ir35: { status: 'inside', route: 'umbrella', sdsOnFile: false, note: 'Inside IR35 via Bright Umbrella Ltd — SDS pending, chase before first invoice.' } },
}

const poRaw: PORaw[] = [
  {
    id: 'po-01', number: 'PO-2026-0007', supplierId: 'sup-05',
    title: 'Smart hands — DC support Q2/Q3', budgetOwner: PEOPLE.engManager, costCenter: 'CC-310 · Network Ops',
    startDate: '2026-04-01', endDate: '2026-09-30',
    lines: [{ description: 'Network engineering support', rate: 95, unit: 'hour', qty: 400, amount: 38000 }],
    notToExceed: 38000, billedToDate: 21850, status: 'partially_billed',
  },
  {
    id: 'po-02', number: 'PO-2026-0011', supplierId: 'sup-06',
    title: 'Cloud migration support — phase 2', budgetOwner: PEOPLE.engManager, costCenter: 'CC-320 · Cloud Platform',
    startDate: '2026-03-15', endDate: '2026-08-31',
    lines: [{ description: 'Cloud engineering (AWS landing zone)', rate: 110, unit: 'hour', qty: 300, amount: 33000 }],
    notToExceed: 33000, billedToDate: 14300, status: 'partially_billed',
  },
  {
    id: 'po-03', number: 'PO-2026-0009', supplierId: 'sup-07',
    title: 'DevOps retainer — platform team', budgetOwner: PEOPLE.engManager, costCenter: 'CC-320 · Cloud Platform',
    startDate: '2026-01-05', endDate: '2026-12-19',
    lines: [{ description: 'DevOps engineering day rate', rate: 760, unit: 'day', qty: 60, amount: 45600 }],
    notToExceed: 45600, billedToDate: 28120, status: 'partially_billed',
  },
  {
    id: 'po-04', number: 'PO-2026-0013', supplierId: 'sup-08',
    title: 'DC smart hands — Frankfurt site', budgetOwner: PEOPLE.serviceManager, costCenter: 'CC-310 · Network Ops',
    startDate: '2026-05-01', endDate: '2026-10-31',
    lines: [{ description: 'On-site smart hands support', rate: 88, unit: 'hour', qty: 250, amount: 22000 }],
    notToExceed: 22000, billedToDate: 7040, status: 'partially_billed',
  },
  {
    id: 'po-05', number: 'PO-2026-0004', supplierId: 'sup-01',
    title: 'Contract recruiters ×3 — Q2 ramp', budgetOwner: PEOPLE.hr, costCenter: 'CC-110 · Talent Acquisition',
    startDate: '2026-04-01', endDate: '2026-09-30',
    lines: [{ description: 'Contract recruiter (3 FTE)', rate: 9800, unit: 'month', qty: 9, amount: 88200 }],
    notToExceed: 88200, billedToDate: 58800, status: 'partially_billed',
  },
  {
    id: 'po-06', number: 'PO-2026-0015', supplierId: 'sup-11',
    title: 'Managed SOC service — FY26', budgetOwner: PEOPLE.serviceManager, costCenter: 'CC-410 · IT Security',
    startDate: '2026-01-01', endDate: '2026-12-31',
    lines: [{ description: 'Managed SOC monthly fee', rate: 8400, unit: 'month', qty: 12, amount: 100800 }],
    notToExceed: 100800, billedToDate: 42000, status: 'partially_billed',
  },
  {
    id: 'po-07', number: 'PO-2026-0017', supplierId: 'sup-12',
    title: 'Network refresh — switches + optics', budgetOwner: PEOPLE.engManager, costCenter: 'CC-310 · Network Ops',
    startDate: '2026-06-01', endDate: '2026-07-31',
    lines: [
      { description: '48-port PoE switches (14)', rate: 3250, unit: 'fixed', qty: 14, amount: 45500 },
      { description: 'SFP+ transceivers (28)', rate: 162.5, unit: 'fixed', qty: 28, amount: 4550 },
    ],
    notToExceed: 50050, billedToDate: 0, status: 'issued',
  },
  {
    id: 'po-08', number: 'PO-2026-0019', supplierId: 'sup-09',
    title: 'Pen-test support — client project', budgetOwner: PEOPLE.serviceManager, costCenter: 'CC-410 · IT Security',
    startDate: '2026-06-15', endDate: '2026-08-15',
    lines: [{ description: 'Security engineering support', rate: 100, unit: 'hour', qty: 128, amount: 12800 }],
    notToExceed: 12800, billedToDate: 0, status: 'draft',
  },
]

export const purchaseOrders: PurchaseOrder[] = poRaw.map((p) => ({
  ...p,
  entityId: SUPPLIER_META[p.supplierId].entityId,
  ...PO_META[p.id],
}))

// Fixed 4-level chain on every invoice: AP → (HR | Line Manager | Budget Owner) → Finance Head → CEO
function chain(
  step2: { approver: string; role: ApprovalStep['role'] },
  progress: 0 | 1 | 2 | 3 | 4,
  dates: string[] = [],
  comment?: { at: number; text: string },
): ApprovalStep[] {
  const steps: ApprovalStep[] = [
    { approver: PEOPLE.ap, role: 'AP', status: 'waiting' },
    { approver: step2.approver, role: step2.role, status: 'waiting' },
    { approver: PEOPLE.financeHead, role: 'Finance Head', status: 'waiting' },
    { approver: PEOPLE.ceo, role: 'CEO', status: 'waiting' },
  ]
  for (let i = 0; i < 4; i++) {
    if (i < progress) {
      steps[i].status = 'approved'
      steps[i].date = dates[i]
    } else if (i === progress) {
      steps[i].status = 'pending'
    }
  }
  if (comment) steps[comment.at].comment = comment.text
  return steps
}

const HR2 = { approver: PEOPLE.hr, role: 'HR' as const }
const LM2 = { approver: PEOPLE.engManager, role: 'Line Manager' as const }
const SM2 = { approver: PEOPLE.serviceManager, role: 'Line Manager' as const }
const BO_ENG = { approver: PEOPLE.engManager, role: 'Budget Owner' as const }
const BO_SVC = { approver: PEOPLE.serviceManager, role: 'Budget Owner' as const }

const invoicesRaw: InvoiceRaw[] = [
  // ---- Captured (AI processed, entering queue) ----
  {
    id: 'inv-001', number: 'RP-2026-014', supplierId: 'sup-05', poId: 'po-01',
    issueDate: '2026-06-10', dueDate: '2026-06-25', receivedDate: '2026-06-11',
    amount: 7220, currency: 'USD', status: 'captured', poNumber: 'PO-2026-0007',
    matchStatus: 'pending', source: 'portal',
    timesheet: { period: 'May 25 – Jun 5', hours: 76, rate: 95 },
    lines: [
      { description: 'Network support — DC migration window (76 hrs)', qty: 76, unitPrice: 95, amount: 7220, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Rajan Pillai', confidence: 0.99 },
      { field: 'Invoice #', value: 'RP-2026-014', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0007', confidence: 0.97 },
      { field: 'Hours', value: '76.0', confidence: 0.96 },
      { field: 'Total', value: '$7,220.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 0),
    anomalies: [],
  },
  {
    id: 'inv-002', number: 'SIH-5544', supplierId: 'sup-12', poId: 'po-07',
    issueDate: '2026-06-09', dueDate: '2026-07-09', receivedDate: '2026-06-11',
    amount: 50050, currency: 'USD', status: 'captured', poNumber: 'PO-2026-0017',
    matchStatus: 'pending', source: 'upload',
    lines: [
      { description: 'Network switches — 48-port PoE (14 units)', qty: 14, unitPrice: 3250, amount: 45500, glCode: '1510 · Computer Equipment', glConfidence: 0.97 },
      { description: 'SFP+ transceivers (28 units)', qty: 28, unitPrice: 162.5, amount: 4550, glCode: '1510 · Computer Equipment', glConfidence: 0.92 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Stellar IT Hardware', confidence: 0.99 },
      { field: 'Invoice #', value: 'SIH-5544', confidence: 0.98 },
      { field: 'PO number', value: 'PO-2026-0017', confidence: 0.95 },
      { field: 'Total', value: '$50,050.00', confidence: 0.99 },
    ],
    approvals: chain(BO_ENG, 0),
    anomalies: [],
  },
  // ---- Needs review (low-confidence fields) ----
  {
    id: 'inv-003', number: 'CSA-2026-118', supplierId: 'sup-04',
    issueDate: '2026-06-09', dueDate: '2026-06-24', receivedDate: '2026-06-10',
    amount: 18400, currency: 'USD', status: 'review',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Placed contractor — wk 22 & 23 (2 engineers)', qty: 160, unitPrice: 115, amount: 18400, glCode: '6420 · Contract Labor', glConfidence: 0.91 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Cobalt Staffing Agency', confidence: 0.97 },
      { field: 'Invoice #', value: 'CSA-2026-118', confidence: 0.99 },
      { field: 'Due date', value: '2026-06-24', confidence: 0.94 },
      { field: 'Total', value: '$18,400.00', confidence: 0.99 },
      { field: 'Bank account', value: '••••6612 (new)', confidence: 0.93 },
    ],
    approvals: chain(HR2, 0),
    anomalies: [
      { type: 'new_supplier', severity: 'medium', message: 'Supplier onboarded 21 days ago — first invoice. W-9 still missing.' },
      { type: 'round_amount', severity: 'low', message: 'No PO reference — placement should bill against a recruitment PO.' },
    ],
  },
  {
    id: 'inv-004', number: 'KTP-0441', supplierId: 'sup-03',
    issueDate: '2026-06-06', dueDate: '2026-07-21', receivedDate: '2026-06-09',
    amount: 32000, currency: 'USD', status: 'review',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Executive search — Head of Delivery (retained fee, 2nd of 3)', qty: 1, unitPrice: 32000, amount: 32000, glCode: '6430 · Recruitment Fees', glConfidence: 0.88 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Korva Talent Partners', confidence: 0.99 },
      { field: 'Invoice #', value: 'KTP-0441', confidence: 0.97 },
      { field: 'Total', value: '$32,000.00', confidence: 0.99 },
      { field: 'PO number', value: 'not found', confidence: 0.41 },
    ],
    approvals: chain(HR2, 0),
    anomalies: [],
  },
  // ---- Exceptions ----
  {
    id: 'inv-005', number: 'RP-2026-013', supplierId: 'sup-05', poId: 'po-01',
    issueDate: '2026-06-02', dueDate: '2026-06-17', receivedDate: '2026-06-03',
    amount: 7960, currency: 'USD', status: 'exception', poNumber: 'PO-2026-0007',
    matchStatus: 'price_variance', source: 'portal',
    timesheet: { period: 'May 11 – May 22', hours: 76, rate: 104.74 },
    lines: [
      { description: 'Network support + out-of-hours callouts (76 hrs)', qty: 76, unitPrice: 104.74, amount: 7960, glCode: '6420 · Contract Labor', glConfidence: 0.97 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Rajan Pillai', confidence: 0.99 },
      { field: 'Invoice #', value: 'RP-2026-013', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0007', confidence: 0.98 },
      { field: 'Rate', value: '$104.74/hr', confidence: 0.95 },
    ],
    approvals: chain(LM2, 0),
    anomalies: [
      { type: 'price_drift', severity: 'high', message: 'Billed rate $104.74/hr exceeds PO-2026-0007 rate of $95.00/hr (+10.3%). Supplier cites out-of-hours uplift — no uplift clause on the PO.' },
    ],
  },
  {
    id: 'inv-006', number: 'TB-0590', supplierId: 'sup-07', poId: 'po-03',
    issueDate: '2026-06-01', dueDate: '2026-06-16', receivedDate: '2026-06-02',
    amount: 11400, currency: 'USD', status: 'exception', poNumber: 'PO-2026-0009',
    matchStatus: 'matched', source: 'portal',
    timesheet: { period: 'May 18 – May 29', hours: 0, rate: 760 },
    lines: [
      { description: 'DevOps retainer — 15 days', qty: 15, unitPrice: 760, amount: 11400, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Tom Becker', confidence: 0.99 },
      { field: 'Invoice #', value: 'TB-0590', confidence: 0.98 },
      { field: 'PO number', value: 'PO-2026-0009', confidence: 0.98 },
      { field: 'Total', value: '$11,400.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 0),
    anomalies: [
      { type: 'duplicate', severity: 'high', message: 'Possible duplicate of TB-0589 ($11,400, period May 18–29, paid Jun 2). Same PO, same period, same amount — likely double submission.' },
    ],
  },
  {
    id: 'inv-007', number: 'SIH-5521', supplierId: 'sup-12',
    issueDate: '2026-06-04', dueDate: '2026-07-04', receivedDate: '2026-06-06',
    amount: 23150, currency: 'USD', status: 'exception',
    matchStatus: 'no_po', source: 'upload',
    lines: [
      { description: 'Laptop refresh — 14" developer spec (10 units)', qty: 10, unitPrice: 2150, amount: 21500, glCode: '1510 · Computer Equipment', glConfidence: 0.96 },
      { description: 'Extended warranty 3-yr', qty: 10, unitPrice: 165, amount: 1650, glCode: '6310 · Equipment Maintenance', glConfidence: 0.89 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Stellar IT Hardware', confidence: 0.99 },
      { field: 'Invoice #', value: 'SIH-5521', confidence: 0.98 },
      { field: 'Total', value: '$23,150.00', confidence: 0.99 },
      { field: 'Bank account', value: '••••9923 (changed from ••••4471)', confidence: 0.96 },
    ],
    approvals: chain(BO_ENG, 0),
    anomalies: [
      { type: 'bank_change', severity: 'high', message: 'Remit-to bank account changed 3 days before payment was due to release. Change request came via email, not portal. Verify by phone before paying.' },
    ],
  },
  {
    id: 'inv-008', number: 'EM-2026-09', supplierId: 'sup-06', poId: 'po-02',
    issueDate: '2026-06-05', dueDate: '2026-06-20', receivedDate: '2026-06-06',
    amount: 9460, currency: 'USD', status: 'exception', poNumber: 'PO-2026-0011',
    matchStatus: 'qty_variance', source: 'portal',
    timesheet: { period: 'May 18 – Jun 1', hours: 86, rate: 110 },
    lines: [
      { description: 'Cloud migration support (86 hrs)', qty: 86, unitPrice: 110, amount: 9460, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Elena Marquez', confidence: 0.99 },
      { field: 'Invoice #', value: 'EM-2026-09', confidence: 0.98 },
      { field: 'Hours', value: '86.0', confidence: 0.93 },
      { field: 'Total', value: '$9,460.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 1, ['2026-06-08'], { at: 0, text: 'Timesheet shows 78 approved hours vs 86 invoiced. Asked supplier to reconcile 8-hour gap.' }),
    anomalies: [
      { type: 'po_overrun', severity: 'medium', message: 'Invoiced 86 hrs vs 78 hrs on the approved timesheet. PO balance also tight: $18,700 remaining on PO-2026-0011.' },
    ],
  },
  // ---- In approval (various steps of the 4-level chain) ----
  {
    id: 'inv-009', number: 'TBR-2088', supplierId: 'sup-01', poId: 'po-05',
    issueDate: '2026-06-01', dueDate: '2026-07-01', receivedDate: '2026-06-02',
    amount: 29400, currency: 'USD', status: 'approval', poNumber: 'PO-2026-0004',
    matchStatus: 'matched', source: 'edi',
    lines: [
      { description: 'Contract recruiters ×3 — May', qty: 3, unitPrice: 9800, amount: 29400, glCode: '6430 · Recruitment Fees', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'TalentBridge Recruitment', confidence: 0.99 },
      { field: 'Invoice #', value: 'TBR-2088', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0004', confidence: 0.98 },
      { field: 'Total', value: '$29,400.00', confidence: 0.99 },
    ],
    approvals: chain(HR2, 1, ['2026-06-04'], { at: 0, text: 'Clean PO match, all three placements confirmed active in May.' }),
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 588, deadline: '2026-06-11' },
  },
  {
    id: 'inv-010', number: 'TB-0592', supplierId: 'sup-07', poId: 'po-03',
    issueDate: '2026-06-08', dueDate: '2026-06-23', receivedDate: '2026-06-08',
    amount: 11400, currency: 'USD', status: 'approval', poNumber: 'PO-2026-0009',
    matchStatus: 'matched', source: 'portal',
    timesheet: { period: 'Jun 1 – Jun 12', hours: 0, rate: 760 },
    lines: [
      { description: 'DevOps retainer — 15 days', qty: 15, unitPrice: 760, amount: 11400, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Tom Becker', confidence: 0.99 },
      { field: 'Invoice #', value: 'TB-0592', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0009', confidence: 0.98 },
      { field: 'Total', value: '$11,400.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 2, ['2026-06-09', '2026-06-10']),
    anomalies: [],
  },
  {
    id: 'inv-011', number: 'SNM-2026-06', supplierId: 'sup-11', poId: 'po-06',
    issueDate: '2026-06-01', dueDate: '2026-07-01', receivedDate: '2026-06-01',
    amount: 8400, currency: 'USD', status: 'approval', poNumber: 'PO-2026-0015',
    matchStatus: 'matched', source: 'edi',
    lines: [
      { description: 'Managed SOC — June service fee', qty: 1, unitPrice: 8400, amount: 8400, glCode: '6440 · Managed IT Services', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'SecureNet MSP', confidence: 0.99 },
      { field: 'Invoice #', value: 'SNM-2026-06', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0015', confidence: 0.98 },
      { field: 'Total', value: '$8,400.00', confidence: 0.99 },
    ],
    approvals: chain(BO_SVC, 3, ['2026-06-02', '2026-06-03', '2026-06-05']),
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 168, deadline: '2026-06-11' },
  },
  {
    id: 'inv-012', number: 'PSS-1107', supplierId: 'sup-02',
    issueDate: '2026-05-04', dueDate: '2026-06-03', receivedDate: '2026-05-06',
    amount: 15520, currency: 'USD', status: 'approval',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Placed contractor — April (1 engineer)', qty: 1, unitPrice: 15520, amount: 15520, glCode: '6420 · Contract Labor', glConfidence: 0.95 },
    ],
    extraction: [
      { field: 'Supplier', value: 'PrimeStaff Solutions', confidence: 0.99 },
      { field: 'Invoice #', value: 'PSS-1107', confidence: 0.98 },
      { field: 'Total', value: '$15,520.00', confidence: 0.99 },
    ],
    approvals: chain(HR2, 2, ['2026-05-08', '2026-05-12'], { at: 2, text: 'Held in Finance queue — no PO; asked HR to raise retroactive PO before sign-off.' }),
    anomalies: [],
  },
  {
    id: 'inv-013', number: 'PSS-1112', supplierId: 'sup-02',
    issueDate: '2026-06-04', dueDate: '2026-07-04', receivedDate: '2026-06-05',
    amount: 15520, currency: 'USD', status: 'approval',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Placed contractor — May (1 engineer)', qty: 1, unitPrice: 15520, amount: 15520, glCode: '6420 · Contract Labor', glConfidence: 0.95 },
    ],
    extraction: [
      { field: 'Supplier', value: 'PrimeStaff Solutions', confidence: 0.99 },
      { field: 'Invoice #', value: 'PSS-1112', confidence: 0.98 },
      { field: 'Total', value: '$15,520.00', confidence: 0.99 },
    ],
    approvals: chain(HR2, 1, ['2026-06-06']),
    anomalies: [],
  },
  // ---- Scheduled ----
  {
    id: 'inv-014', number: 'YT-2026-03', supplierId: 'sup-08', poId: 'po-04',
    issueDate: '2026-05-29', dueDate: '2026-06-13', receivedDate: '2026-05-30',
    amount: 7040, currency: 'USD', status: 'scheduled', poNumber: 'PO-2026-0013',
    matchStatus: 'matched', source: 'portal',
    timesheet: { period: 'May 4 – May 28', hours: 80, rate: 88 },
    lines: [
      { description: 'Frankfurt DC smart hands (80 hrs)', qty: 80, unitPrice: 88, amount: 7040, glCode: '6420 · Contract Labor', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Yuki Tanaka', confidence: 0.99 },
      { field: 'Invoice #', value: 'YT-2026-03', confidence: 0.99 },
      { field: 'PO number', value: 'PO-2026-0013', confidence: 0.98 },
      { field: 'Total', value: '$7,040.00', confidence: 0.99 },
    ],
    approvals: chain(SM2, 4, ['2026-05-31', '2026-06-01', '2026-06-02', '2026-06-03']),
    anomalies: [],
  },
  {
    id: 'inv-015', number: 'HCS-INV-9034', supplierId: 'sup-10',
    issueDate: '2026-06-05', dueDate: '2026-07-05', receivedDate: '2026-06-05',
    amount: 27100, currency: 'USD', status: 'scheduled',
    matchStatus: 'no_po', source: 'portal',
    lines: [
      { description: 'Compute + storage — May usage', qty: 1, unitPrice: 23700, amount: 23700, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Premium support plan', qty: 1, unitPrice: 3400, amount: 3400, glCode: '6520 · Software Subscriptions', glConfidence: 0.96 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Helix Cloud Services', confidence: 0.99 },
      { field: 'Invoice #', value: 'HCS-INV-9034', confidence: 0.99 },
      { field: 'Total', value: '$27,100.00', confidence: 0.99 },
    ],
    approvals: chain(BO_ENG, 4, ['2026-06-06', '2026-06-07', '2026-06-08', '2026-06-09']),
    anomalies: [],
  },
  // ---- Paid ----
  {
    id: 'inv-016', number: 'TB-0589', supplierId: 'sup-07', poId: 'po-03',
    issueDate: '2026-05-29', dueDate: '2026-06-13', receivedDate: '2026-05-29',
    amount: 11400, currency: 'USD', status: 'paid', poNumber: 'PO-2026-0009',
    matchStatus: 'matched', source: 'portal', paidDate: '2026-06-02',
    timesheet: { period: 'May 18 – May 29', hours: 0, rate: 760 },
    lines: [
      { description: 'DevOps retainer — 15 days', qty: 15, unitPrice: 760, amount: 11400, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Tom Becker', confidence: 0.99 },
      { field: 'Invoice #', value: 'TB-0589', confidence: 0.99 },
      { field: 'Total', value: '$11,400.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 4, ['2026-05-30', '2026-05-30', '2026-05-31', '2026-06-01']),
    anomalies: [],
  },
  {
    id: 'inv-017', number: 'RP-2026-012', supplierId: 'sup-05', poId: 'po-01',
    issueDate: '2026-05-12', dueDate: '2026-05-27', receivedDate: '2026-05-13',
    amount: 6650, currency: 'USD', status: 'paid', poNumber: 'PO-2026-0007',
    matchStatus: 'matched', source: 'portal', paidDate: '2026-05-26',
    timesheet: { period: 'Apr 27 – May 8', hours: 70, rate: 95 },
    lines: [
      { description: 'Network support (70 hrs)', qty: 70, unitPrice: 95, amount: 6650, glCode: '6420 · Contract Labor', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Rajan Pillai', confidence: 0.99 },
      { field: 'Invoice #', value: 'RP-2026-012', confidence: 0.99 },
      { field: 'Total', value: '$6,650.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 4, ['2026-05-14', '2026-05-15', '2026-05-16', '2026-05-18']),
    anomalies: [],
  },
  {
    id: 'inv-018', number: 'TBR-2071', supplierId: 'sup-01', poId: 'po-05',
    issueDate: '2026-05-01', dueDate: '2026-05-31', receivedDate: '2026-05-02',
    amount: 29400, currency: 'USD', status: 'paid', poNumber: 'PO-2026-0004',
    matchStatus: 'matched', source: 'edi', paidDate: '2026-05-11',
    lines: [
      { description: 'Contract recruiters ×3 — April', qty: 3, unitPrice: 9800, amount: 29400, glCode: '6430 · Recruitment Fees', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'TalentBridge Recruitment', confidence: 0.99 },
      { field: 'Invoice #', value: 'TBR-2071', confidence: 0.99 },
      { field: 'Total', value: '$29,400.00', confidence: 0.99 },
    ],
    approvals: chain(HR2, 4, ['2026-05-04', '2026-05-05', '2026-05-07', '2026-05-08']),
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 588, deadline: '2026-05-11' },
  },
  {
    id: 'inv-019', number: 'EM-2026-08', supplierId: 'sup-06', poId: 'po-02',
    issueDate: '2026-05-04', dueDate: '2026-05-19', receivedDate: '2026-05-05',
    amount: 8580, currency: 'USD', status: 'paid', poNumber: 'PO-2026-0011',
    matchStatus: 'matched', source: 'portal', paidDate: '2026-05-18',
    timesheet: { period: 'Apr 20 – May 1', hours: 78, rate: 110 },
    lines: [
      { description: 'Cloud migration support (78 hrs)', qty: 78, unitPrice: 110, amount: 8580, glCode: '6420 · Contract Labor', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Elena Marquez', confidence: 0.99 },
      { field: 'Invoice #', value: 'EM-2026-08', confidence: 0.99 },
      { field: 'Total', value: '$8,580.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 4, ['2026-05-06', '2026-05-07', '2026-05-08', '2026-05-11']),
    anomalies: [],
  },
  {
    id: 'inv-020', number: 'SNM-2026-05', supplierId: 'sup-11', poId: 'po-06',
    issueDate: '2026-05-01', dueDate: '2026-05-31', receivedDate: '2026-05-01',
    amount: 8400, currency: 'USD', status: 'paid', poNumber: 'PO-2026-0015',
    matchStatus: 'matched', source: 'edi', paidDate: '2026-05-08',
    lines: [
      { description: 'Managed SOC — May service fee', qty: 1, unitPrice: 8400, amount: 8400, glCode: '6440 · Managed IT Services', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'SecureNet MSP', confidence: 0.99 },
      { field: 'Invoice #', value: 'SNM-2026-05', confidence: 0.99 },
      { field: 'Total', value: '$8,400.00', confidence: 0.99 },
    ],
    approvals: chain(BO_SVC, 4, ['2026-05-02', '2026-05-03', '2026-05-05', '2026-05-06']),
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 168, deadline: '2026-05-11' },
  },
  {
    id: 'inv-021', number: 'AD-2026-02', supplierId: 'sup-09',
    issueDate: '2026-04-30', dueDate: '2026-05-15', receivedDate: '2026-05-01',
    amount: 6400, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'upload', paidDate: '2026-05-14',
    timesheet: { period: 'Apr 14 – Apr 25', hours: 64, rate: 100 },
    lines: [
      { description: 'Security review — client onboarding (64 hrs)', qty: 64, unitPrice: 100, amount: 6400, glCode: '6420 · Contract Labor', glConfidence: 0.97 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Amara Diallo', confidence: 0.99 },
      { field: 'Invoice #', value: 'AD-2026-02', confidence: 0.98 },
      { field: 'Total', value: '$6,400.00', confidence: 0.99 },
    ],
    approvals: chain(SM2, 4, ['2026-05-02', '2026-05-04', '2026-05-06', '2026-05-07']),
    anomalies: [],
  },
  {
    id: 'inv-022', number: 'HCS-INV-8911', supplierId: 'sup-10',
    issueDate: '2026-05-05', dueDate: '2026-06-04', receivedDate: '2026-05-05',
    amount: 27100, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'portal', paidDate: '2026-06-02',
    lines: [
      { description: 'Compute + storage — April usage', qty: 1, unitPrice: 23700, amount: 23700, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Premium support plan', qty: 1, unitPrice: 3400, amount: 3400, glCode: '6520 · Software Subscriptions', glConfidence: 0.96 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Helix Cloud Services', confidence: 0.99 },
      { field: 'Invoice #', value: 'HCS-INV-8911', confidence: 0.99 },
      { field: 'Total', value: '$27,100.00', confidence: 0.99 },
    ],
    approvals: chain(BO_ENG, 4, ['2026-05-06', '2026-05-08', '2026-05-11', '2026-05-12']),
    anomalies: [],
  },
]

// billable invoices inherit the client PO from their purchase order; overrides below
const INVOICE_META: Record<string, { costType?: 'internal'; clientPoId?: string }> = {
  'inv-002': { costType: 'internal' },               // network refresh hardware
  'inv-007': { costType: 'internal' },               // laptop refresh
  'inv-015': { costType: 'internal' },               // cloud usage
  'inv-022': { costType: 'internal' },               // cloud usage (paid)
  'inv-011': { clientPoId: 'cpo-03' },               // SOC fee re-billed to Initech
  'inv-020': { clientPoId: 'cpo-03' },
  'inv-021': { clientPoId: 'cpo-01' },               // Amara security review on Acme programme
  // intentionally unmapped billable → assurance exceptions: inv-003 (Cobalt), inv-004 (Korva), inv-012/013 (PrimeStaff)
}

export const invoices: Invoice[] = [
  ...invoicesRaw.map((i) => {
    const meta = INVOICE_META[i.id] ?? {}
    const viaPo = i.poId ? PO_META[i.poId]?.clientPoId : undefined
    return {
      ...i,
      entityId: SUPPLIER_META[i.supplierId].entityId,
      currency: SUPPLIER_META[i.supplierId].currency,
      docType: 'invoice' as const,
      costType: meta.costType ?? 'billable' as const,
      clientPoId: meta.clientPoId ?? viaPo,
    }
  }),
  // ---- Credit notes ----
  {
    id: 'cn-001', number: 'CN-TBR-0114', supplierId: 'sup-01', entityId: 'ent-uk',
    docType: 'credit_note', costType: 'billable', clientPoId: 'cpo-04', linkedInvoiceId: 'inv-018',
    poId: 'po-05', poNumber: 'PO-2026-0004',
    issueDate: '2026-06-03', dueDate: '2026-06-03', receivedDate: '2026-06-04',
    amount: -1960, currency: 'GBP', status: 'approval',
    matchStatus: 'matched', source: 'email',
    lines: [
      { description: 'Credit — recruiter absence 2 days in April (ref TBR-2071)', qty: -2, unitPrice: 980, amount: -1960, glCode: '6430 · Recruitment Fees', glConfidence: 0.97 },
    ],
    extraction: [
      { field: 'Supplier', value: 'TalentBridge Recruitment', confidence: 0.99 },
      { field: 'Credit note #', value: 'CN-TBR-0114', confidence: 0.98 },
      { field: 'Linked invoice', value: 'TBR-2071', confidence: 0.96 },
      { field: 'Total', value: '-£1,960.00', confidence: 0.99 },
    ],
    approvals: chain(HR2, 1, ['2026-06-05']),
    anomalies: [],
  },
  {
    id: 'cn-002', number: 'CN-EM-002', supplierId: 'sup-06', entityId: 'ent-es',
    docType: 'credit_note', costType: 'billable', clientPoId: 'cpo-05', linkedInvoiceId: 'inv-008',
    poId: 'po-02', poNumber: 'PO-2026-0011',
    issueDate: '2026-06-10', dueDate: '2026-06-10', receivedDate: '2026-06-10',
    amount: -880, currency: 'EUR', status: 'review',
    matchStatus: 'matched', source: 'portal',
    lines: [
      { description: 'Credit — 8 unconfirmed hours on EM-2026-09', qty: -8, unitPrice: 110, amount: -880, glCode: '6420 · Contract Labor', glConfidence: 0.98 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Elena Marquez', confidence: 0.99 },
      { field: 'Credit note #', value: 'CN-EM-002', confidence: 0.98 },
      { field: 'Linked invoice', value: 'EM-2026-09', confidence: 0.97 },
      { field: 'Total', value: '-€880.00', confidence: 0.99 },
    ],
    approvals: chain(LM2, 0),
    anomalies: [],
  },
]

export const recurringSchedules: RecurringSchedule[] = [
  { id: 'rec-01', supplierId: 'sup-11', poId: 'po-06', description: 'Managed SOC monthly fee', amount: 8400, currency: 'GBP', frequency: 'monthly', nextRun: '2026-07-01', active: true, entityId: 'ent-uk' },
  { id: 'rec-02', supplierId: 'sup-10', description: 'Cloud usage + premium support', amount: 27100, currency: 'USD', frequency: 'monthly', nextRun: '2026-07-05', active: true, entityId: 'ent-us' },
  { id: 'rec-03', supplierId: 'sup-01', poId: 'po-05', description: 'Contract recruiters ×3 monthly', amount: 29400, currency: 'GBP', frequency: 'monthly', nextRun: '2026-07-01', active: true, entityId: 'ent-uk' },
]

export const auditEvents: AuditEvent[] = [
  { id: 'aud-01', ts: '2026-06-11 09:42', actor: 'Sarah Chen', role: 'AP Manager (admin)', action: 'Reassigned pending approver', target: 'PSS-1112 — step 2 HR: Priya Nair → Marta Kowalska (cover)', reason: 'Priya on leave Jun 10–17', kind: 'override' },
  { id: 'aud-02', ts: '2026-06-10 17:05', actor: 'David Osei', role: 'Finance Head', action: 'Reopened approved invoice', target: 'TBR-2071 — GL recode 6420 → 6430 after audit query', reason: 'Misposted to Contract Labor; recruiter fees belong in 6430', kind: 'override' },
  { id: 'aud-03', ts: '2026-06-10 14:20', actor: 'Ingrid Olsen', role: 'CEO', action: 'Approved (step 4 of 4)', target: 'YT-2026-03 — Yuki Tanaka, SGD 7,040', kind: 'approval' },
  { id: 'aud-04', ts: '2026-06-09 11:12', actor: 'Sarah Chen', role: 'AP Manager (admin)', action: 'Amended client PO mapping', target: 'SNM-2026-06 → ACME-PO-2231 → corrected to INI-2026-118', reason: 'SOC service is re-billed to Initech, not Acme', kind: 'override' },
  { id: 'aud-05', ts: '2026-06-08 16:40', actor: 'System', role: 'Scheduler', action: 'Recurring draft generated', target: 'rec-02 — Helix Cloud Services, USD 27,100 for July', kind: 'system' },
  { id: 'aud-06', ts: '2026-06-08 10:02', actor: 'David Osei', role: 'Finance Head', action: 'Updated approver assignment', target: 'ent-de Finance Head: David Osei → Lukas Brandt', reason: 'Germany finance head hired', kind: 'config' },
  { id: 'aud-07', ts: '2026-06-05 09:15', actor: 'Sarah Chen', role: 'AP Manager (admin)', action: 'Entity added', target: 'NCons Sweden AB (SEK) — active', kind: 'config' },
  { id: 'aud-08', ts: '2026-06-04 13:30', actor: 'Priya Nair', role: 'HR', action: 'Approved (step 2 of 4)', target: 'TBR-2088 — TalentBridge, GBP 29,400', kind: 'approval' },
]

export const adminConfig: AdminConfig = {
  hrApprover: PEOPLE.hr,
  ceo: PEOPLE.ceo,
  financeHeads: {
    'ent-uk': PEOPLE.financeHead,
    'ent-us': PEOPLE.financeHead,
    'ent-de': 'Lukas Brandt',
    'ent-es': PEOPLE.financeHead,
    'ent-nl': PEOPLE.financeHead,
    'ent-pl': PEOPLE.financeHead,
    'ent-ae': PEOPLE.financeHead,
    'ent-in': 'Anita Rao',
    'ent-sg': 'Wei Lin Tan',
    'ent-se': PEOPLE.financeHead,
  },
  lineManagers: [PEOPLE.engManager, PEOPLE.serviceManager],
}

export const paymentBatches: PaymentBatch[] = [
  { id: 'bat-061226', runDate: '2026-06-12', method: 'ACH', invoiceCount: 4, total: 49940, status: 'pending_release', savings: 756 },
  { id: 'bat-061926', runDate: '2026-06-19', method: 'ACH', invoiceCount: 3, total: 34140, status: 'draft', savings: 168 },
  { id: 'bat-060526', runDate: '2026-06-05', method: 'ACH', invoiceCount: 6, total: 71350, status: 'settled', savings: 1344 },
  { id: 'bat-052926', runDate: '2026-05-29', method: 'ACH', invoiceCount: 8, total: 96820, status: 'settled', savings: 1512 },
]

export const activities: Activity[] = [
  { id: 'act-1', actor: 'Aprio AI', action: 'flagged possible duplicate', target: 'TB-0590 vs TB-0589 — same PO, same period, same amount', time: '8 min ago', kind: 'ai' },
  { id: 'act-2', actor: 'Aprio AI', action: 'captured + matched invoice', target: 'RP-2026-014 — 76 hrs at $95/hr against PO-2026-0007', time: '24 min ago', kind: 'ai' },
  { id: 'act-3', actor: 'Priya Nair', action: 'approved (HR, step 2 of 4)', target: 'TBR-2088 — TalentBridge, $29,400', time: '1 hr ago', kind: 'user' },
  { id: 'act-4', actor: 'Aprio AI', action: 'detected bank account change', target: 'Stellar IT Hardware — remit-to changed via email request', time: '2 hrs ago', kind: 'ai' },
  { id: 'act-5', actor: 'Aprio AI', action: 'rate violation alert', target: 'RP-2026-013 — $104.74/hr vs $95.00/hr on PO-2026-0007', time: '5 hrs ago', kind: 'ai' },
  { id: 'act-6', actor: 'Ingrid Olsen', action: 'approved (CEO, step 4 of 4)', target: 'YT-2026-03 — Yuki Tanaka, $7,040', time: 'Yesterday', kind: 'user' },
  { id: 'act-7', actor: 'David Osei', action: 'held in Finance queue', target: 'PSS-1107 — no PO; retroactive PO requested from HR', time: 'Yesterday', kind: 'user' },
  { id: 'act-8', actor: 'System', action: 'payment batch settled', target: 'BAT-060526 — 6 invoices, $71,350 via ACH', time: '3 hrs ago', kind: 'system' },
]

export const monthlyTrend = [
  { month: 'Jan', processed: 64, touchless: 39, spend: 248000 },
  { month: 'Feb', processed: 58, touchless: 38, spend: 226000 },
  { month: 'Mar', processed: 71, touchless: 49, spend: 284000 },
  { month: 'Apr', processed: 69, touchless: 50, spend: 271000 },
  { month: 'May', processed: 78, touchless: 60, spend: 309000 },
  { month: 'Jun', processed: 31, touchless: 25, spend: 134000 },
]

export const cashForecast = [
  { week: 'Jun 8–14', scheduled: 49940, projected: 14000 },
  { week: 'Jun 15–21', scheduled: 42100, projected: 21000 },
  { week: 'Jun 22–28', scheduled: 33920, projected: 26000 },
  { week: 'Jun 29–Jul 5', scheduled: 29400, projected: 31000 },
  { week: 'Jul 6–12', scheduled: 50050, projected: 24000 },
  { week: 'Jul 13–19', scheduled: 0, projected: 46000 },
]

export const supplierById = (id: string) => suppliers.find((s) => s.id === id)!
export const poById = (id: string) => purchaseOrders.find((p) => p.id === id)
export const poBySupplier = (supplierId: string) =>
  purchaseOrders.filter((p) => p.supplierId === supplierId && p.status !== 'closed' && p.status !== 'draft')
export const entityById = (id: string) => entities.find((e) => e.id === id)
export const clientPoById = (id: string) => clientPOs.find((c) => c.id === id)
