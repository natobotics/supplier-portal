// Data access layer — live Supabase when configured, mock data otherwise.
//
// Cutover pattern (docs/DEPLOYMENT.md §4): pages call these fetchers via
// useLiveData() instead of importing arrays from src/data.ts directly.
// Column names are snake_case in Postgres; map to the camelCase app types here
// so no page component changes shape.

import { useEffect, useState } from 'react'
import { supabase, isLive } from './supabase'
import type { Supplier, Entity, Invoice } from '../types'
import {
  suppliers as mockSuppliers,
  entities as mockEntities,
  invoices as mockInvoices,
} from '../data'

export { isLive }

// Render mock data immediately, swap in live rows when the fetch lands.
// Keeps every page synchronous-looking during the cutover.
function useLive<T>(fetcher: () => Promise<T[]>, fallback: T[]): T[] {
  const [rows, setRows] = useState<T[]>(fallback)
  useEffect(() => {
    if (!isLive) return
    let cancelled = false
    fetcher()
      .then((live) => {
        if (!cancelled && live.length > 0) setRows(live)
      })
      .catch((err) => console.warn('Live fetch failed — staying on demo data:', err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return rows
}

export const useSuppliers = () => useLive(fetchSuppliers, mockSuppliers)
export const useEntities = () => useLive(fetchEntities, mockEntities)
export const useInvoices = () => useLive(fetchInvoices, mockInvoices)

export async function fetchEntities(): Promise<Entity[]> {
  if (!supabase) return mockEntities
  const { data, error } = await supabase.from('entities').select('*').order('name')
  if (error) throw error
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    currency: r.currency,
    taxRegime: r.tax_regime ?? '',
    active: r.active,
  }))
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  if (!supabase) return mockSuppliers
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data.map((r) => ({
    id: r.id,
    entityId: r.entity_id,
    name: r.name,
    segment: r.segment,
    category: r.category ?? '',
    contactName: r.contact_name ?? '',
    email: r.email,
    paymentTerms: r.payment_terms ?? '',
    discountTerms: r.discount_terms ?? undefined,
    paymentMethod: r.payment_method ?? 'ACH',
    currency: r.currency,
    taxFormStatus: r.tax_form_status,
    bankVerified: r.bank_verified,
    riskLevel: r.risk_level,
    onboarded: r.onboarded_at ?? '',
    // live aggregates come from a view in a later cutover step
    ytdSpend: 0,
    openBalance: 0,
    avgPayDays: 0,
    country: '',
  }))
}

export async function fetchInvoices(): Promise<Invoice[]> {
  if (!supabase) return mockInvoices
  const { data, error } = await supabase
    .from('invoices')
    .select('*, approvals(*)')
    .order('received_at', { ascending: false })
  if (error) throw error
  return data.map((r) => ({
    id: r.id,
    number: r.number,
    supplierId: r.supplier_id,
    entityId: r.entity_id,
    docType: r.doc_type,
    costType: r.cost_type,
    clientPoId: r.client_po_id ?? undefined,
    linkedInvoiceId: r.linked_invoice_id ?? undefined,
    poId: r.po_id ?? undefined,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    receivedDate: (r.received_at ?? '').slice(0, 10),
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    matchStatus: r.match_status,
    source: r.source,
    timesheet: r.timesheet ?? undefined,
    lines: r.lines ?? [],
    extraction: r.extraction ?? [],
    approvals: (r.approvals ?? [])
      .sort((a: { step: number }, b: { step: number }) => a.step - b.step)
      .map((a: Record<string, unknown>) => ({
        approver: a.approver,
        role: a.role,
        status: a.status,
        date: a.decided_at ? String(a.decided_at).slice(0, 10) : undefined,
        comment: a.comment ?? undefined,
      })),
    anomalies: r.anomalies ?? [],
    discount: r.discount ?? undefined,
    paidDate: r.paid_at ?? undefined,
  }))
}
