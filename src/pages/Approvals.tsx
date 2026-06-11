import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import { Card, CardHeader, MatchBadge, Button } from '../components/ui'
import { invoices, supplierById } from '../data'
import { fmtMoney, fmtDate, daysOverdue, cls } from '../utils'
import type { Invoice } from '../types'

export function Approvals({ onOpen }: { onOpen: (inv: Invoice) => void }) {
  const [decided, setDecided] = useState<Record<string, 'approved' | 'rejected'>>({})

  const queue = invoices.filter((i) => i.approvals.some((a) => a.status === 'pending'))
  const myQueue = queue.filter((i) => i.approvals.find((a) => a.status === 'pending'))
  const remaining = myQueue.filter((i) => !decided[i.id])
  const total = remaining.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{remaining.length} invoices</span> waiting ·{' '}
            <span className="tabular font-mono font-medium text-ink">{fmtMoney(total)}</span> total
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Approvals route by amount: &lt;$10k AP Manager · &lt;$100k + Controller · ≥$100k + CFO
          </p>
        </div>
        <Button variant="secondary">Delegate approvals</Button>
      </div>

      <div className="space-y-3">
        {myQueue.map((inv) => {
          const s = supplierById(inv.supplierId)
          const pending = inv.approvals.find((a) => a.status === 'pending')!
          const over = daysOverdue(inv.dueDate) > 0
          const state = decided[inv.id]
          const ageDays = Math.max(0, daysOverdue(inv.receivedDate))
          return (
            <Card
              key={inv.id}
              className={cls(
                'transition-opacity duration-300',
                state && 'opacity-50',
              )}
            >
              <div className="flex flex-wrap items-center gap-4 p-4">
                <button
                  onClick={() => onOpen(inv)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-ink">{inv.number}</span>
                      <MatchBadge status={inv.matchStatus} />
                      {inv.anomalies.length > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                          <AlertTriangle size={11} aria-hidden="true" />
                          {inv.anomalies.length} flag{inv.anomalies.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {over && (
                        <span className="text-[11px] font-medium text-danger">
                          {daysOverdue(inv.dueDate)}d overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-soft">
                      {s.name} · due {fmtDate(inv.dueDate)} · waiting on{' '}
                      <span className="font-medium text-ink">{pending.approver}</span> ({pending.role})
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                      <Clock size={11} aria-hidden="true" /> in queue {ageDays} days
                    </p>
                  </div>
                  <span className="tabular hidden font-mono text-base font-semibold whitespace-nowrap text-ink sm:block">
                    {fmtMoney(inv.amount)}
                  </span>
                  <ChevronRight size={16} className="hidden text-ink-faint sm:block" aria-hidden="true" />
                </button>
                <div className="flex shrink-0 gap-2">
                  {state === 'approved' ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                      <CheckCircle2 size={15} aria-hidden="true" /> Approved
                    </span>
                  ) : state === 'rejected' ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                      <XCircle size={15} aria-hidden="true" /> Rejected
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setDecided((d) => ({ ...d, [inv.id]: 'rejected' }))}
                      >
                        Reject
                      </Button>
                      <Button onClick={() => setDecided((d) => ({ ...d, [inv.id]: 'approved' }))}>
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {myQueue.length === 0 && (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-ink-faint">Approval queue is clear. Nice.</p>
        </Card>
      )}

      <Card>
        <CardHeader title="Policy" subtitle="Current routing rules" />
        <div className="grid gap-3 p-5 pt-2 sm:grid-cols-3">
          {[
            { range: 'Under $10,000', chain: 'AP Manager', sla: '24h SLA' },
            { range: '$10,000 – $99,999', chain: 'AP Manager → Controller', sla: '48h SLA' },
            { range: '$100,000 and above', chain: 'AP Manager → Controller → CFO', sla: '72h SLA' },
          ].map((p) => (
            <div key={p.range} className="rounded-lg border border-line bg-canvas p-3.5">
              <p className="tabular font-mono text-[13px] font-semibold text-ink">{p.range}</p>
              <p className="mt-1 text-xs text-ink-soft">{p.chain}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{p.sla}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
