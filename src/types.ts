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

export type RiskLevel = 'low' | 'medium' | 'high'

export interface Supplier {
  id: string
  name: string
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
  role: string
  status: 'approved' | 'pending' | 'waiting' | 'rejected'
  date?: string
  comment?: string
}

export interface Anomaly {
  type: AnomalyType
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface Invoice {
  id: string
  number: string
  supplierId: string
  issueDate: string
  dueDate: string
  receivedDate: string
  amount: number
  currency: string
  status: InvoiceStatus
  poNumber?: string
  matchStatus: MatchStatus
  source: 'email' | 'upload' | 'edi' | 'portal'
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
  | 'approvals'
  | 'payments'
  | 'suppliers'
  | 'reports'
