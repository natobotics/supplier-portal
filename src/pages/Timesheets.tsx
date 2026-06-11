import { useState } from 'react'
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Send,
  X,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { timesheetWeeks, poById, supplierById } from '../data'
import { TODAY, fmtMoney, fmtDate, fmtDateShort, cls } from '../utils'
import type { TimesheetWeek } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// Suppliers that log time — drives the contractor persona select.
const contractorIds = Array.from(new Set(timesheetWeeks.map((w) => w.supplierId)))

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const TODAY_ISO = isoDate(TODAY)

function nextMonday(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return isoDate(d)
}

const pillStyles: Record<TimesheetWeek['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'border border-line bg-canvas text-ink-faint' },
  submitted: { label: 'Submitted', cls: 'bg-info-soft text-secondary' },
  approved: { label: 'Approved', cls: 'bg-accent-soft text-accent' },
  rejected: { label: 'Rejected', cls: 'bg-danger-soft text-danger' },
}

function WeekPill({ status }: { status: TimesheetWeek['status'] }) {
  const s = pillStyles[status]
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        s.cls,
      )}
    >
      {s.label}
    </span>
  )
}

function HourGrid({
  week,
  editable,
  onChange,
}: {
  week: TimesheetWeek
  editable: boolean
  onChange?: (day: number, value: number) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAYS.map((d, i) =>
        editable ? (
          <label key={d} className="block">
            <span className="mb-1 block text-center text-[10px] font-medium tracking-wide text-ink-faint uppercase">
              {d}
            </span>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={week.hours[i] === 0 ? '' : week.hours[i]}
              placeholder="0"
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onChange?.(i, Number.isFinite(v) ? Math.min(24, Math.max(0, v)) : 0)
              }}
              className="tabular w-full rounded-md border border-line bg-surface px-1 py-1.5 text-center font-mono text-sm text-ink focus:outline-2 focus:outline-primary"
            />
          </label>
        ) : (
          <div key={d}>
            <span className="mb-1 block text-center text-[10px] font-medium tracking-wide text-ink-faint uppercase">
              {d}
            </span>
            <div
              className={cls(
                'tabular rounded-md border border-line bg-canvas px-1 py-1.5 text-center font-mono text-sm',
                week.hours[i] === 0 ? 'text-ink-faint' : 'text-ink',
              )}
            >
              {week.hours[i]}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

export function Timesheets() {
  const [view, setView] = useState<'contractor' | 'manager'>('contractor')
  // Seed local state from mock data — all mutations stay in this session.
  const [weeks, setWeeks] = useState<TimesheetWeek[]>(() =>
    timesheetWeeks.map((w) => ({ ...w, hours: [...w.hours] })),
  )
  const [personaId, setPersonaId] = useState(contractorIds[0] ?? 'sup-05')
  const [justSubmitted, setJustSubmitted] = useState<string[]>([])
  const [justDrafted, setJustDrafted] = useState<string[]>([])
  const [decidedIds, setDecidedIds] = useState<string[]>([])
  const [rejecting, setRejecting] = useState<Record<string, string>>({})

  const updateWeek = (id: string, patch: Partial<TimesheetWeek>) =>
    setWeeks((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)))

  const setHour = (id: string, day: number, value: number) =>
    setWeeks((ws) =>
      ws.map((w) =>
        w.id === id ? { ...w, hours: w.hours.map((h, i) => (i === day ? value : h)) } : w,
      ),
    )

  const submitWeek = (id: string) => {
    updateWeek(id, { status: 'submitted', submittedAt: TODAY_ISO })
    setJustSubmitted((ids) => [...ids, id])
  }

  const draftInvoice = (id: string) => {
    updateWeek(id, { invoiceDrafted: true })
    setJustDrafted((ids) => [...ids, id])
  }

  const decide = (w: TimesheetWeek, status: 'approved' | 'rejected', comment?: string) => {
    updateWeek(w.id, {
      status,
      approver: poById(w.poId)?.budgetOwner ?? 'Budget owner',
      decidedAt: TODAY_ISO,
      ...(comment ? { comment } : {}),
    })
    setDecidedIds((ids) => [...ids, w.id])
  }

  const addWeek = () => {
    const mine = weeks.filter((w) => w.supplierId === personaId)
    const latest = mine.reduce((m, w) => (w.weekStart > m ? w.weekStart : m), '')
    const sup = supplierById(personaId)
    setWeeks((ws) => [
      ...ws,
      {
        id: `tw-new-${ws.length + 1}`,
        supplierId: personaId,
        poId: mine[0]?.poId ?? '',
        entityId: sup.entityId,
        weekStart: latest ? nextMonday(latest) : TODAY_ISO,
        hours: [0, 0, 0, 0, 0, 0, 0],
        status: 'draft',
      },
    ])
  }

  const persona = supplierById(personaId)
  const myWeeks = weeks
    .filter((w) => w.supplierId === personaId)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  const queue = weeks.filter((w) => w.status === 'submitted' || decidedIds.includes(w.id))
  const pendingCount = weeks.filter((w) => w.status === 'submitted').length

  return (
    <div className="space-y-5 p-6">
      {/* View switch */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          {(
            [
              { id: 'contractor', label: 'Contractor view' },
              { id: 'manager', label: 'Manager approvals' },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={cls(
                'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
                view === v.id ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === 'manager' && (
          <span className="text-xs text-ink-faint">
            <span className="tabular font-mono font-semibold text-ink">{pendingCount}</span>{' '}
            awaiting review
          </span>
        )}
      </div>

      {view === 'contractor' ? (
        <>
          {/* Persona */}
          <Card>
            <CardHeader
              title="Who are you"
              subtitle="Pick the contractor account you are logging time as"
            />
            <div className="space-y-2.5 p-5 pt-2">
              <label className="block max-w-md">
                <span className="mb-1 block text-xs font-medium text-ink-soft">
                  Contractor account
                </span>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className={cls(inputCls, 'cursor-pointer')}
                >
                  {contractorIds.map((id) => {
                    const s = supplierById(id)
                    return (
                      <option key={id} value={id}>
                        {s.name} — {s.category}
                      </option>
                    )
                  })}
                </select>
              </label>
              <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
                <Info size={13} aria-hidden="true" />
                Production: this comes from the supplier&apos;s login.
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {persona.contactName} — {myWeeks.length} week{myWeeks.length === 1 ? '' : 's'}
            </p>
            <Button variant="secondary" onClick={addWeek}>
              <CalendarPlus size={14} aria-hidden="true" /> Add week
            </Button>
          </div>

          {myWeeks.map((w) => {
            const po = poById(w.poId)
            const line = po?.lines[0]
            const rate = line?.rate ?? 0
            const currency = persona.currency
            const total = w.hours.reduce((a, b) => a + b, 0)
            const editable = w.status === 'draft' || w.status === 'rejected'
            const approver = po?.budgetOwner ?? 'Budget owner'
            return (
              <Card key={w.id}>
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Week of {fmtDateShort(w.weekStart)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        <span className="font-mono">{po?.number ?? 'No PO'}</span> ·{' '}
                        <span className="tabular font-mono">{fmtMoney(rate, currency)}</span> /{' '}
                        {line?.unit ?? 'hour'} · approver {approver}
                      </p>
                    </div>
                    <WeekPill status={w.status} />
                  </div>

                  <HourGrid
                    week={w}
                    editable={editable}
                    onChange={(day, value) => setHour(w.id, day, value)}
                  />

                  {w.status === 'rejected' && w.comment && (
                    <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
                      <X size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{w.approver ?? approver}:</span>{' '}
                        {w.comment}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <p className="text-[13px] text-ink-soft">
                      <span className="tabular font-mono font-semibold text-ink">{total}</span>{' '}
                      hrs ·{' '}
                      <span className="tabular font-mono font-semibold text-ink">
                        {fmtMoney(total * rate, currency)}
                      </span>
                      {w.submittedAt && (
                        <span className="text-ink-faint">
                          {' '}
                          · submitted {fmtDateShort(w.submittedAt)}
                        </span>
                      )}
                    </p>
                    {editable && (
                      <Button disabled={total <= 0} onClick={() => submitWeek(w.id)}>
                        <Send size={14} aria-hidden="true" /> Submit for approval
                      </Button>
                    )}
                  </div>

                  {justSubmitted.includes(w.id) && w.status === 'submitted' && (
                    <div className="flex items-center gap-2 rounded-lg bg-info-soft px-3.5 py-2.5 text-[13px] text-secondary">
                      <Send size={14} className="shrink-0" aria-hidden="true" />
                      Submitted for approval — routed to {approver} for review.
                    </div>
                  )}

                  {w.status === 'approved' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5">
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-accent">
                        <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
                        Approved by {w.approver ?? approver}
                        {w.decidedAt && ` ${fmtDate(w.decidedAt)}`}
                      </p>
                      {w.invoiceDrafted ? (
                        <span className="text-xs text-ink-faint">Invoice drafted</span>
                      ) : (
                        <Button onClick={() => draftInvoice(w.id)}>
                          <FileText size={14} aria-hidden="true" /> Draft invoice from timesheet
                        </Button>
                      )}
                    </div>
                  )}

                  {justDrafted.includes(w.id) && (
                    <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-accent">
                      <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
                      Draft invoice created — review in Submit invoice.
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </>
      ) : (
        <>
          {queue.length === 0 && (
            <Card>
              <p className="p-5 text-sm text-ink-faint">
                No submitted timesheets waiting for review.
              </p>
            </Card>
          )}

          {queue.map((w) => {
            const sup = supplierById(w.supplierId)
            const po = poById(w.poId)
            const line = po?.lines[0]
            const rate = line?.rate ?? 0
            const total = w.hours.reduce((a, b) => a + b, 0)
            const decided = decidedIds.includes(w.id)
            const comment = rejecting[w.id]
            return (
              <Card
                key={w.id}
                className={cls('transition-opacity duration-200', decided && 'opacity-60')}
              >
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {sup.name} — Week of {fmtDateShort(w.weekStart)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        <span className="font-mono">{po?.number ?? 'No PO'}</span> ·{' '}
                        <span className="tabular font-mono">{fmtMoney(rate, sup.currency)}</span>{' '}
                        / {line?.unit ?? 'hour'} · approver {po?.budgetOwner ?? 'Budget owner'}
                      </p>
                    </div>
                    <WeekPill status={w.status} />
                  </div>

                  <HourGrid week={w} editable={false} />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <p className="text-[13px] text-ink-soft">
                      <span className="tabular font-mono font-semibold text-ink">{total}</span>{' '}
                      hrs ·{' '}
                      <span className="tabular font-mono font-semibold text-ink">
                        {fmtMoney(total * rate, sup.currency)}
                      </span>
                      {w.submittedAt && (
                        <span className="text-ink-faint">
                          {' '}
                          · submitted {fmtDateShort(w.submittedAt)}
                        </span>
                      )}
                    </p>
                    {w.status === 'submitted' && (
                      <div className="flex items-center gap-2">
                        <Button onClick={() => decide(w, 'approved')}>
                          <Check size={14} aria-hidden="true" /> Approve
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setRejecting((r) => {
                              const next = { ...r }
                              if (w.id in next) delete next[w.id]
                              else next[w.id] = ''
                              return next
                            })
                          }
                        >
                          <X size={14} aria-hidden="true" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {w.status === 'submitted' && comment !== undefined && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-ink-soft">
                        Rejection comment (required)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) =>
                            setRejecting((r) => ({ ...r, [w.id]: e.target.value }))
                          }
                          placeholder="Tell the contractor what to fix…"
                          className={inputCls}
                        />
                        <Button
                          variant="danger"
                          disabled={comment.trim().length === 0}
                          onClick={() => decide(w, 'rejected', comment.trim())}
                        >
                          Reject
                        </Button>
                      </div>
                    </label>
                  )}

                  {decided && (
                    <p
                      className={cls(
                        'flex items-center gap-1.5 text-[13px] font-medium',
                        w.status === 'approved' ? 'text-accent' : 'text-danger',
                      )}
                    >
                      {w.status === 'approved' ? (
                        <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
                      ) : (
                        <X size={14} className="shrink-0" aria-hidden="true" />
                      )}
                      {w.status === 'approved' ? 'Approved' : 'Rejected'} — decision recorded{' '}
                      {fmtDate(TODAY_ISO)}; the contractor sees it instantly.
                    </p>
                  )}
                </div>
              </Card>
            )
          })}

          <Card>
            <div className="flex items-start gap-2.5 p-5">
              <Info size={15} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
              <p className="text-[13px] text-ink-soft">
                Approved timesheets are the goods-receipt leg of the 3-way match — invoices
                auto-validate against them.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
