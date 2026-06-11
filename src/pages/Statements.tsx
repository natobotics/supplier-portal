import { useState } from 'react'
import { CheckCircle2, FileDown, Inbox, Info } from 'lucide-react'
import { Card, CardHeader, Button, StatusBadge } from '../components/ui'
import { suppliers, invoices, supplierById } from '../data'
import { fmtMoney, fmtDate, fmtDateShort, daysOverdue, cls } from '../utils'
import type { Invoice } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'

const dotCls: Record<string, string> = {
  approved: 'bg-accent',
  pending: 'bg-warn animate-pulse',
  rejected: 'bg-danger',
  waiting: 'bg-line',
}

// Mini 4-dot approval chain + plain-English position — the "where's my money" answer.
function WhereIsIt({ inv }: { inv: Invoice }) {
  let text: string
  if (inv.status === 'paid') {
    text = inv.paidDate ? `Paid ${fmtDateShort(inv.paidDate)}` : 'Paid'
  } else if (inv.status === 'scheduled') {
    text = 'Scheduled'
  } else if (inv.status === 'rejected' || inv.approvals.some((a) => a.status === 'rejected')) {
    text = 'Rejected'
  } else {
    const idx = inv.approvals.findIndex((a) => a.status === 'pending')
    text = idx >= 0 ? `Step ${idx + 1} of 4 — ${inv.approvals[idx].role}` : 'Step 1 of 4 — AP'
  }
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className="flex items-center gap-1" aria-hidden="true">
        {inv.approvals.map((a, i) => (
          <span key={i} className={cls('h-1.5 w-1.5 rounded-full', dotCls[a.status])} />
        ))}
      </span>
      <span className="text-xs text-ink-soft">{text}</span>
    </span>
  )
}

function BalanceTile({ label, value, ccy }: { label: string; value: number; ccy: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-4 py-3">
      <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">{label}</p>
      <p className="tabular mt-1 font-mono text-lg font-semibold text-ink">{fmtMoney(value, ccy)}</p>
    </div>
  )
}

export function Statements() {
  const [supplierId, setSupplierId] = useState('')
  const [remitFor, setRemitFor] = useState<string | null>(null)

  const supplier = supplierId ? supplierById(supplierId) : undefined

  const docs = supplier
    ? invoices
        .filter((i) => i.supplierId === supplier.id)
        .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
    : []

  const ccy = supplier?.currency ?? 'USD'
  const openBalance = docs
    .filter((d) => d.status !== 'paid' && d.status !== 'rejected')
    .reduce((s, d) => s + d.amount, 0)
  const inApproval = docs.filter((d) => d.status === 'approval').reduce((s, d) => s + d.amount, 0)
  const scheduled = docs.filter((d) => d.status === 'scheduled').reduce((s, d) => s + d.amount, 0)
  const paidDocs = docs
    .filter((d) => d.status === 'paid')
    .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))
  const paidYtd = paidDocs.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-5 p-6">
      {/* Persona — which supplier am I */}
      <Card>
        <CardHeader
          title="Your statement"
          subtitle="Everything we hold for your account — invoices, credit notes, approvals and payments"
        />
        <div className="space-y-2.5 p-5 pt-2">
          <label className="block max-w-md">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Supplier account</span>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value)
                setRemitFor(null)
              }}
              className={cls(inputCls, 'cursor-pointer')}
            >
              <option value="" disabled>
                Select your company…
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.category}
                </option>
              ))}
            </select>
          </label>
          <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Info size={13} aria-hidden="true" />
            Production: this comes from the supplier&apos;s login.
          </p>
        </div>
      </Card>

      {!supplier && (
        <Card>
          <p className="px-5 py-8 text-center text-sm text-ink-faint">
            Select your company to view your statement.
          </p>
        </Card>
      )}

      {supplier && docs.length === 0 && (
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="rounded-full bg-canvas p-3 text-ink-faint">
              <Inbox size={18} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-ink">No documents yet</h2>
            <p className="mt-1 max-w-sm text-xs text-ink-faint">
              No invoices or credit notes on file for {supplier.name}. Once you submit your first
              invoice it will appear here with live approval status.
            </p>
          </div>
        </Card>
      )}

      {supplier && docs.length > 0 && (
        <>
          {/* Balance strip — supplier's own billing currency, never converted */}
          <Card>
            <CardHeader
              title="Balance"
              subtitle={`All amounts in ${ccy} — your billing currency, never converted`}
              action={
                <span className="text-xs text-ink-soft">
                  avg days to pay:{' '}
                  <span className="tabular font-mono font-semibold text-ink">
                    {supplier.avgPayDays}
                  </span>
                </span>
              }
            />
            <div className="grid gap-3 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
              <BalanceTile label="Open balance" value={openBalance} ccy={ccy} />
              <BalanceTile label="In approval" value={inApproval} ccy={ccy} />
              <BalanceTile label="Scheduled" value={scheduled} ccy={ccy} />
              <BalanceTile label="Paid YTD" value={paidYtd} ccy={ccy} />
            </div>
          </Card>

          {/* Statement — every document, newest first */}
          <Card>
            <CardHeader
              title="Statement"
              subtitle={`${docs.length} document${docs.length === 1 ? '' : 's'} — newest first`}
            />
            <div className="overflow-x-auto px-5 pb-5 pt-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-medium tracking-wide text-ink-faint uppercase">
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 pr-4 font-medium">Received</th>
                    <th className="py-2 pr-4 font-medium">Due</th>
                    <th className="py-2 pr-4 text-right font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Where is it?</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => {
                    const overdue =
                      d.status !== 'paid' && d.status !== 'rejected' && daysOverdue(d.dueDate) > 0
                    return (
                      <tr key={d.id} className="border-b border-line last:border-0">
                        <td className="py-2.5 pr-4 whitespace-nowrap">
                          <span className="font-mono text-[13px] text-ink">{d.number}</span>
                          {d.docType === 'credit_note' && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                              CN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-ink-soft">
                          {fmtDateShort(d.receivedDate)}
                        </td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-ink-soft">
                          {fmtDateShort(d.dueDate)}
                          {overdue && (
                            <span className="ml-1.5 text-[11px] text-danger">
                              {daysOverdue(d.dueDate)}d overdue
                            </span>
                          )}
                        </td>
                        <td
                          className={cls(
                            'tabular py-2.5 pr-4 text-right font-mono font-medium whitespace-nowrap',
                            d.amount < 0 ? 'text-danger' : 'text-ink',
                          )}
                        >
                          {fmtMoney(d.amount, ccy)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="py-2.5">
                          <WhereIsIt inv={d} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payments received — remittance advice */}
          <Card>
            <CardHeader
              title="Payments received"
              subtitle="One remittance advice per payment — download anytime"
            />
            <div className="space-y-2.5 p-5 pt-2">
              {remitFor && (
                <p className="flex items-center gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Remittance advice downloaded (PDF stub) —{' '}
                  <span className="font-mono">{remitFor}</span>
                </p>
              )}
              {paidDocs.length === 0 && (
                <p className="py-3 text-sm text-ink-faint">No payments received yet.</p>
              )}
              {paidDocs.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-2.5"
                >
                  <span className="w-24 text-xs whitespace-nowrap text-ink-soft">
                    {d.paidDate ? fmtDate(d.paidDate) : '—'}
                  </span>
                  <span className="min-w-0 flex-1 font-mono text-[13px] text-ink">{d.number}</span>
                  <span className="tabular font-mono text-sm font-semibold text-ink">
                    {fmtMoney(d.amount, ccy)}
                  </span>
                  <Button variant="ghost" className="px-2.5 py-1.5" onClick={() => setRemitFor(d.number)}>
                    <FileDown size={14} aria-hidden="true" /> Remittance advice
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
