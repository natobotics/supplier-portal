import { Fragment, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  X,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, MatchBadge, Button } from '../components/ui'
import { invoices, supplierById } from '../data'
import { fmtMoney, fmtDate, daysOverdue, cls } from '../utils'
import type { ApprovalStep, ApproverRole, Invoice } from '../types'
import { APPROVAL_CHAIN, PEOPLE } from '../types'

const ROLES: ApproverRole[] = ['AP', 'HR', 'Line Manager', 'Budget Owner', 'Finance Head', 'CEO']

const tabs: Array<{ id: ApproverRole | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  ...ROLES.map((r) => ({ id: r, label: r })),
]

const pendingStep = (inv: Invoice) => inv.approvals.find((a) => a.status === 'pending')

const dotStyles: Record<ApprovalStep['status'], string> = {
  approved: 'bg-accent text-white',
  pending: 'animate-pulse bg-warn text-white',
  waiting: 'border border-line bg-canvas text-ink-faint',
  rejected: 'bg-danger text-white',
}

function ChainStepper({ steps }: { steps: ApprovalStep[] }) {
  return (
    <div className="flex w-44 shrink-0 items-center" aria-label="Approval chain progress">
      {steps.map((step, i) => (
        <Fragment key={`${step.role}-${i}`}>
          {i > 0 && (
            <span
              className={cls(
                'h-0.5 min-w-3 flex-1 rounded-full',
                steps[i - 1].status === 'approved' ? 'bg-accent' : 'bg-line',
              )}
            />
          )}
          <span
            title={`Step ${i + 1} · ${step.role}: ${step.approver}`}
            className={cls(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
              dotStyles[step.status],
            )}
          >
            {step.status === 'approved' && <Check size={11} aria-hidden="true" />}
            {step.status === 'rejected' && <X size={11} aria-hidden="true" />}
          </span>
        </Fragment>
      ))}
    </div>
  )
}

const step2Routing = [
  { segment: 'Sub-contractor', route: 'HR', who: PEOPLE.hr },
  { segment: 'Freelancer', route: 'Line Manager', who: `${PEOPLE.engManager} / ${PEOPLE.serviceManager}` },
  { segment: 'IT services', route: 'Budget Owner', who: 'Budget owner named on the PO' },
]

export function Approvals({ onOpen }: { onOpen: (inv: Invoice) => void }) {
  const [decided, setDecided] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [tab, setTab] = useState<ApproverRole | 'all'>('all')

  const queue = useMemo(
    () =>
      invoices
        .filter((i) => pendingStep(i) !== undefined)
        .sort((a, b) => a.receivedDate.localeCompare(b.receivedDate)),
    [],
  )

  const live = queue.filter((i) => !decided[i.id])
  const total = live.reduce((s, i) => s + i.amount, 0)
  const counts: Record<string, number> = { all: live.length }
  for (const r of ROLES) counts[r] = live.filter((i) => pendingStep(i)!.role === r).length

  const rows = tab === 'all' ? queue : queue.filter((i) => pendingStep(i)!.role === tab)

  return (
    <div className="space-y-4 p-6">
      {/* Header strip */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{live.length} invoices</span> waiting ·{' '}
            <span className="tabular font-mono font-medium text-ink">{fmtMoney(total)}</span> total
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Fixed 4-step chain on every invoice: AP → HR / Line Manager / Budget Owner → Finance
            Head → CEO
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <span
                key={r}
                className={cls(
                  'rounded-full border border-line bg-surface px-2 py-0.5 text-[11px]',
                  counts[r] > 0 ? 'text-ink-soft' : 'text-ink-faint',
                )}
              >
                {r}{' '}
                <span className={cls('tabular font-semibold', counts[r] > 0 ? 'text-ink' : 'text-ink-faint')}>
                  {counts[r]}
                </span>
              </span>
            ))}
          </div>
        </div>
        <Button variant="secondary">Delegate approvals</Button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cls(
              'cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
              tab === t.id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-canvas hover:text-ink',
            )}
          >
            {t.label}
            <span className={cls('ml-1.5 text-[11px]', tab === t.id ? 'text-white/70' : 'text-ink-faint')}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue */}
      <div className="space-y-3">
        {rows.map((inv) => {
          const s = supplierById(inv.supplierId)
          const pending = pendingStep(inv)!
          const stepNo = inv.approvals.findIndex((a) => a.status === 'pending') + 1
          const over = daysOverdue(inv.dueDate)
          const state = decided[inv.id]
          return (
            <Card key={inv.id} className={cls('transition-opacity duration-300', state && 'opacity-50')}>
              <div className="cursor-pointer p-4" onClick={() => onOpen(inv)}>
                <div className="flex flex-wrap items-center gap-4">
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
                      {over > 0 && (
                        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                          {over}d overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[13px] text-ink-soft">
                      <span className="font-medium text-ink">{s.name}</span>
                      {inv.poNumber && (
                        <>
                          {' '}· <span className="font-mono text-xs">{inv.poNumber}</span>
                        </>
                      )}{' '}
                      · due {fmtDate(inv.dueDate)}
                    </p>
                    {inv.timesheet && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                        <Clock size={11} aria-hidden="true" />
                        <span className="tabular font-mono">
                          {inv.timesheet.hours.toFixed(1)} hrs × {fmtMoney(inv.timesheet.rate)}
                        </span>
                        <span>— {inv.timesheet.period}</span>
                      </p>
                    )}
                  </div>
                  <span className="tabular font-mono text-lg font-semibold whitespace-nowrap text-ink">
                    {fmtMoney(inv.amount)}
                  </span>
                  <ChevronRight size={16} className="hidden text-ink-faint lg:block" aria-hidden="true" />
                  <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
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
                {/* Chain stepper */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
                  <ChainStepper steps={inv.approvals} />
                  <p className="text-xs text-ink-faint">
                    Step {stepNo} of 4 — waiting on{' '}
                    <span className="font-medium text-ink-soft">{pending.approver}</span> ({pending.role})
                  </p>
                </div>
              </div>
            </Card>
          )
        })}

        {rows.length === 0 && (
          <Card>
            <p className="px-5 py-12 text-center text-sm text-ink-faint">
              {tab === 'all'
                ? 'Approval queue is clear. Nice.'
                : `Nothing waiting on ${tab} right now.`}
            </p>
          </Card>
        )}
      </div>

      {/* Policy */}
      <Card>
        <CardHeader
          title="Approval policy — fixed chain, every invoice, any amount"
          subtitle="Four steps, always in this order. No amount-based skipping."
        />
        <div className="space-y-4 p-5 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {APPROVAL_CHAIN.map((step, i) => (
              <div key={step.role} className="rounded-lg border border-line bg-canvas p-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[13px] font-semibold text-ink">
                    {i === 1 ? 'HR / Line Manager / Budget Owner' : step.role}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{step.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-line bg-canvas">
            <p className="border-b border-line px-3.5 py-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Step 2 routes by supplier segment
            </p>
            <ul className="divide-y divide-line text-[13px]">
              {step2Routing.map((r) => (
                <li key={r.segment} className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
                  <span className="w-32 shrink-0 font-medium text-ink">{r.segment}</span>
                  <ArrowRight size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                  <span className="text-ink-soft">
                    <span className="font-medium text-ink">{r.route}</span> · {r.who}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
