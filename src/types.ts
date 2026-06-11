export type InvoiceStatus =
  | 'captured'
  | 'review'
  | 'exception'
  | 'approval'
  | 'scheduled'
  | 'paid'
  | 'rejected'

export type MatchStatus = 'matched' | 'price_variance' | 'qty_variance' | 'no_po' | 'pending'

export type AnomalyType =
  | 'duplicate'
  | 'price_drift'
  | 'bank_change'
  | 'new_supplier'
  | 'round_amount'
  | 'po_overrun'

export type RiskLevel = 'low' | 'medium' | 'high'

// Drives step-2 approval routing:
// subcontractor → HR · freelancer → line manager · it_services → PO budget owner
export type SupplierSegment = 'subcontractor' | 'freelancer' | 'it_services'

export type ApproverRole = 'AP' | 'HR' | 'Line Manager' | 'Budget Owner' | 'Finance Head' | 'CEO'

export interface Supplier {
  id: string
  name: string
  segment: SupplierSegment
  category: string
  contactName: string
  email: string
  paymentTerms: string
  discountTerms?: string
  paymentMethod: 'ACH' | 'Wire' | 'Card' | 'Check'
  taxFormStatus: 'verified' | 'pending' | 'missing'
  bankVerified: boolean
  riskLevel: RiskLevel
  onboarded: string
  ytdSpend: number
  openBalance: number
  avgPayDays: number
  country: string
}

export type POUnit = 'hour' | 'day' | 'month' | 'fixed'

export interface POLine {
  description: string
  rate: number
  unit: POUnit
  qty: number
  amount: number
}

export type POStatus = 'draft' | 'issued' | 'partially_billed' | 'fully_billed' | 'closed'

export interface PurchaseOrder {
  id: string
  number: string
  supplierId: string
  title: string
  budgetOwner: string
  costCenter: string
  startDate: string
  endDate: string
  lines: POLine[]
  notToExceed: number
  billedToDate: number
  status: POStatus
}

export interface LineItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
  glCode: string
  glConfidence: number
}

export interface ExtractedField {
  field: string
  value: string
  confidence: number
}

export interface ApprovalStep {
  approver: string
  role: ApproverRole
  status: 'approved' | 'pending' | 'waiting' | 'rejected'
  date?: string
  comment?: string
}

export interface Anomaly {
  type: AnomalyType
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface Timesheet {
  period: string
  hours: number
  rate: number
}

export interface Invoice {
  id: string
  number: string
  supplierId: string
  poId?: string
  issueDate: string
  dueDate: string
  receivedDate: string
  amount: number
  currency: string
  status: InvoiceStatus
  poNumber?: string
  matchStatus: MatchStatus
  source: 'email' | 'upload' | 'edi' | 'portal'
  timesheet?: Timesheet
  lines: LineItem[]
  extraction: ExtractedField[]
  approvals: ApprovalStep[]
  anomalies: Anomaly[]
  discount?: { terms: string; amount: number; deadline: string }
  paidDate?: string
  memo?: string
}

export interface PaymentBatch {
  id: string
  runDate: string
  method: string
  invoiceCount: number
  total: number
  status: 'draft' | 'pending_release' | 'released' | 'settled'
  savings: number
}

export interface Activity {
  id: string
  actor: string
  action: string
  target: string
  time: string
  kind: 'ai' | 'user' | 'system'
}

export type Page =
  | 'dashboard'
  | 'invoices'
  | 'capture'
  | 'submit'
  | 'pos'
  | 'approvals'
  | 'payments'
  | 'suppliers'
  | 'reports'

// Fixed 4-level approval chain applied to every invoice regardless of amount.
// Step 2 approver resolves from the supplier segment / PO budget owner.
export const APPROVAL_CHAIN: Array<{ role: ApproverRole; note: string }> = [
  { role: 'AP', note: 'Verification — extraction, duplicate/fraud, PO match' },
  { role: 'HR', note: 'Step 2 routes by segment: HR, Line Manager, or Budget Owner' },
  { role: 'Finance Head', note: 'Budget and cash sign-off' },
  { role: 'CEO', note: 'Final approval — every invoice' },
]

export const PEOPLE = {
  ap: 'Sarah Chen',
  hr: 'Priya Nair',
  engManager: 'James Holt',
  serviceManager: 'Aisha Bello',
  financeHead: 'David Osei',
  ceo: 'Ingrid Olsen',
} as const
