import { useState } from 'react'
import {
  Download,
  Pencil,
  RotateCcw,
  Save,
  ShieldAlert,
  UserCog,
} from 'lucide-react'
import { Button, Card, CardHeader } from '../components/ui'
import { adminConfig, auditEvents, entities, entityById, invoices, supplierById } from '../data'
import { useEntity } from '../context'
import { cls, fmtMoney } from '../utils'
import type { AuditEvent } from '../types'
import { APPROVAL_CHAIN } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

const labelCls = 'mb-1 block text-xs font-medium text-ink-soft'

const kindStyles: Record<AuditEvent['kind'], { label: string; cls: string }> = {
  override: { label: 'Override', cls: 'bg-warn-soft text-warn' },
  config: { label: 'Config', cls: 'bg-info-soft text-secondary' },
  approval: { label: 'Approval', cls: 'bg-accent-soft text-accent' },
  edit: { label: 'Edit', cls: 'bg-canvas text-ink-soft border border-line' },
  system: { label: 'System', cls: 'bg-canvas text-ink-soft border border-line' },
}

const KIND_FILTERS: Array<{ key: 'all' | AuditEvent['kind']; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'override', label: 'Override' },
  { key: 'config', label: 'Config' },
  { key: 'approval', label: 'Approval' },
  { key: 'system', label: 'System' },
]

const statusLabel: Record<string, string> = {
  approval: 'In approval',
  scheduled: 'Scheduled',
  paid: 'Paid',
}

let auditSeq = 0

function stamp(): string {
  const d = new Date()
  return `2026-06-11 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function nextId(): string {
  auditSeq += 1
  return `aud-local-${auditSeq}`
}

type OverrideMode = 'reassign' | 'amend' | null

export function Admin() {
  const { entity } = useEntity()

  // ---- audit feed (seeded + local additions, newest first) ----
  const [feed, setFeed] = useState<AuditEvent[]>(auditEvents)
  const [kindFilter, setKindFilter] = useState<'all' | AuditEvent['kind']>('all')

  const append = (e: Omit<AuditEvent, 'id' | 'ts' | 'actor' | 'role'>) => {
    setFeed((f) => [
      { id: nextId(), ts: stamp(), actor: 'Sarah Chen', role: 'AP Manager (admin)', ...e },
      ...f,
    ])
  }

  // ---- section 1: approver assignments ----
  const [hr, setHr] = useState(adminConfig.hrApprover)
  const [ceo, setCeo] = useState(adminConfig.ceo)
  const [lms, setLms] = useState<string[]>([...adminConfig.lineManagers])
  const [finHeads, setFinHeads] = useState<Record<string, string>>({ ...adminConfig.financeHeads })
  const [chainSaved, setChainSaved] = useState(false)
  const [finSaved, setFinSaved] = useState(false)

  const saveChainAssignments = () => {
    append({
      action: 'Updated approver assignments',
      target: `HR: ${hr} · CEO: ${ceo} · Line managers: ${lms.filter(Boolean).join(', ')}`,
      kind: 'config',
    })
    setChainSaved(true)
  }

  const saveFinanceHeads = () => {
    const changed = entities.filter(
      (en) => (finHeads[en.id] ?? '') !== (adminConfig.financeHeads[en.id] ?? ''),
    )
    append({
      action: 'Updated finance head assignments',
      target: changed.length
        ? changed.map((en) => `${en.name}: Finance Head → ${finHeads[en.id]}`).join(' · ')
        : `Per-entity finance heads re-confirmed (${entities.length} entities)`,
      kind: 'config',
    })
    setFinSaved(true)
  }

  // ---- section 2: post-approval overrides ----
  const eligible = invoices.filter(
    (i) => i.status === 'approval' || i.status === 'scheduled' || i.status === 'paid',
  )
  const scoped = entity === 'all' ? eligible : eligible.filter((i) => i.entityId === entity)

  const [selId, setSelId] = useState('')
  const sel = scoped.find((i) => i.id === selId)
  const [reason, setReason] = useState('')
  const reasonOk = reason.trim().length >= 10
  const [mode, setMode] = useState<OverrideMode>(null)
  const [newApprover, setNewApprover] = useState('')
  const [amendNote, setAmendNote] = useState('')
  const [banner, setBanner] = useState<string | null>(null)

  const actionsDisabled = !sel || !reasonOk

  const recordOverride = (action: string, target: string, message: string) => {
    if (!sel || !reasonOk) return
    append({ action, target, reason: reason.trim(), kind: 'override' })
    setBanner(message)
    setMode(null)
    setReason('')
    setNewApprover('')
    setAmendNote('')
  }

  const doReopen = () => {
    if (!sel) return
    recordOverride(
      'Reopened for re-approval',
      `${sel.number} — ${supplierById(sel.supplierId).name}: returned to step 1 of 4`,
      `Override recorded — invoice ${sel.number} returned to step 1 of 4 for re-approval.`,
    )
  }

  const doReassign = () => {
    if (!sel || !newApprover.trim()) return
    recordOverride(
      'Reassigned pending approver',
      `${sel.number} — ${supplierById(sel.supplierId).name}: pending approver → ${newApprover.trim()}`,
      `Override recorded — pending approver on ${sel.number} reassigned to ${newApprover.trim()} — change applied.`,
    )
  }

  const doAmend = () => {
    if (!sel || !amendNote.trim()) return
    recordOverride(
      'Amended GL / client PO mapping',
      `${sel.number} — ${supplierById(sel.supplierId).name}: ${amendNote.trim()}`,
      `Override recorded — GL / client PO mapping on ${sel.number} amended — change applied.`,
    )
  }

  const pendingIdx = sel ? sel.approvals.findIndex((a) => a.status === 'pending') : -1

  const visibleEvents = kindFilter === 'all' ? feed : feed.filter((e) => e.kind === kindFilter)

  return (
    <div className="space-y-5 p-6">
      {/* ---- 1. Approver assignments ---- */}
      <Card>
        <CardHeader
          title="Approver assignments"
          subtitle="The 4-step chain shape is fixed by policy — the assignments below are editable"
        />
        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-canvas px-3.5 py-2.5">
            {APPROVAL_CHAIN.map((s, i) => (
              <span key={s.role} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-ink-faint">
                    →
                  </span>
                )}
                <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink">
                  {i + 1}. {s.role}
                </span>
              </span>
            ))}
            <span className="text-[11px] text-ink-faint">
              Applies to every invoice — people are editable, the chain shape is not.
            </span>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* role assignments */}
            <div className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="adm-hr">
                  HR approver (step 2 — subcontractors)
                </label>
                <input
                  id="adm-hr"
                  className={inputCls}
                  value={hr}
                  onChange={(e) => {
                    setHr(e.target.value)
                    setChainSaved(false)
                  }}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="adm-ceo">
                  CEO (step 4 — final approval)
                </label>
                <input
                  id="adm-ceo"
                  className={inputCls}
                  value={ceo}
                  onChange={(e) => {
                    setCeo(e.target.value)
                    setChainSaved(false)
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((idx) => (
                  <div key={idx}>
                    <label className={labelCls} htmlFor={`adm-lm-${idx}`}>
                      Line manager {idx + 1} (step 2 — freelancers)
                    </label>
                    <input
                      id={`adm-lm-${idx}`}
                      className={inputCls}
                      value={lms[idx] ?? ''}
                      onChange={(e) => {
                        setLms((prev) => {
                          const next = [...prev]
                          next[idx] = e.target.value
                          return next
                        })
                        setChainSaved(false)
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={saveChainAssignments}>
                  <Save size={14} aria-hidden="true" /> Save assignments
                </Button>
                {chainSaved && (
                  <span className="text-xs text-accent">Saved — recorded in the audit log</span>
                )}
              </div>
            </div>

            {/* per-entity finance heads */}
            <div>
              <p className={labelCls}>Finance head (step 3) — per entity</p>
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-canvas text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="px-3 py-2 font-medium">Entity</th>
                      <th className="px-3 py-2 font-medium">Finance head</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {entities.map((en) => (
                      <tr key={en.id}>
                        <td className="px-3 py-1.5">
                          <span className="font-medium text-ink">{en.name}</span>
                          <span className="block text-[11px] text-ink-faint">
                            {en.country} · {en.currency}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            aria-label={`Finance head for ${en.name}`}
                            className={inputCls}
                            value={finHeads[en.id] ?? ''}
                            onChange={(e) => {
                              setFinHeads((prev) => ({ ...prev, [en.id]: e.target.value }))
                              setFinSaved(false)
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <Button onClick={saveFinanceHeads}>
                  <Save size={14} aria-hidden="true" /> Save finance heads
                </Button>
                {finSaved && (
                  <span className="text-xs text-accent">Saved — recorded in the audit log</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---- 2. Post-approval overrides ---- */}
      <Card>
        <CardHeader
          title="Post-approval overrides"
          subtitle="Overrides never delete history — they append."
        />
        <div className="space-y-4 px-5 pb-5">
          {banner && (
            <div className="flex items-start gap-2.5 rounded-lg bg-warn-soft px-4 py-3 text-[13px] text-warn">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 leading-relaxed">{banner}</span>
              <button
                className="cursor-pointer text-xs font-medium underline"
                onClick={() => setBanner(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ov-invoice">
                Invoice
                {entity !== 'all' && (
                  <span className="font-normal text-ink-faint">
                    {' '}
                    — scoped to {entityById(entity)?.name}
                  </span>
                )}
              </label>
              <select
                id="ov-invoice"
                className={inputCls}
                value={selId}
                onChange={(e) => {
                  setSelId(e.target.value)
                  setMode(null)
                  setBanner(null)
                }}
              >
                <option value="">Select an invoice…</option>
                {scoped.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.number} — {supplierById(i.supplierId).name} — {statusLabel[i.status]}
                  </option>
                ))}
              </select>
              {sel && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  {entityById(sel.entityId)?.name} ·{' '}
                  <span className="tabular font-mono text-ink-soft">
                    {fmtMoney(sel.amount, sel.currency)}
                  </span>{' '}
                  ·{' '}
                  {pendingIdx >= 0
                    ? `pending at step ${pendingIdx + 1} of 4 (${sel.approvals[pendingIdx].role})`
                    : 'approval chain complete'}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="ov-reason">
                Reason — required, minimum 10 characters
              </label>
              <textarea
                id="ov-reason"
                rows={2}
                className={cls(inputCls, 'resize-none')}
                placeholder="Why is this override needed? Recorded verbatim in the audit log."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {reason.length > 0 && !reasonOk && (
                <p className="mt-1 text-[11px] text-warn">
                  {10 - reason.trim().length} more character{10 - reason.trim().length === 1 ? '' : 's'} needed.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" disabled={actionsDisabled} onClick={doReopen}>
              <RotateCcw size={14} aria-hidden="true" /> Reopen for re-approval
            </Button>
            <Button
              variant="secondary"
              disabled={actionsDisabled}
              onClick={() => setMode(mode === 'reassign' ? null : 'reassign')}
            >
              <UserCog size={14} aria-hidden="true" /> Reassign pending approver
            </Button>
            <Button
              variant="secondary"
              disabled={actionsDisabled}
              onClick={() => setMode(mode === 'amend' ? null : 'amend')}
            >
              <Pencil size={14} aria-hidden="true" /> Amend GL / client PO mapping
            </Button>
          </div>

          {mode === 'reassign' && sel && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
              <div className="min-w-[220px] flex-1">
                <label className={labelCls} htmlFor="ov-approver">
                  New approver for the pending step
                </label>
                <input
                  id="ov-approver"
                  className={inputCls}
                  placeholder="e.g. Marta Kowalska"
                  value={newApprover}
                  onChange={(e) => setNewApprover(e.target.value)}
                />
              </div>
              <Button disabled={!newApprover.trim()} onClick={doReassign}>
                Apply reassignment
              </Button>
            </div>
          )}

          {mode === 'amend' && sel && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
              <div className="min-w-[220px] flex-1">
                <label className={labelCls} htmlFor="ov-amend">
                  Describe the GL / client PO change
                </label>
                <input
                  id="ov-amend"
                  className={inputCls}
                  placeholder="e.g. GL 6420 → 6430 · client PO → INI-2026-118"
                  value={amendNote}
                  onChange={(e) => setAmendNote(e.target.value)}
                />
              </div>
              <Button disabled={!amendNote.trim()} onClick={doAmend}>
                Apply amendment
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ---- 3. Audit log ---- */}
      <Card>
        <CardHeader
          title="Audit log"
          subtitle="Every config change, override, and approval — appended, never edited"
          action={
            <Button variant="secondary">
              <Download size={14} aria-hidden="true" /> Export CSV
            </Button>
          }
        />
        <div className="flex flex-wrap gap-1.5 px-5 pt-1 pb-3">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setKindFilter(f.key)}
              className={cls(
                'cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-200',
                kindFilter === f.key
                  ? 'bg-primary text-white'
                  : 'border border-line text-ink-soft hover:bg-canvas',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Actor</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Target</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 font-medium">Kind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleEvents.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="py-2.5 pr-4 font-mono text-xs whitespace-nowrap text-ink-soft">
                    {e.ts}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-ink">{e.actor}</span>
                    <span className="block text-[11px] text-ink-faint">{e.role}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-ink">{e.action}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{e.target}</td>
                  <td className="py-2.5 pr-4 text-ink-soft italic">{e.reason ?? '—'}</td>
                  <td className="py-2.5">
                    <span
                      className={cls(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                        kindStyles[e.kind].cls,
                      )}
                    >
                      {kindStyles[e.kind].label}
                    </span>
                  </td>
                </tr>
              ))}
              {visibleEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-ink-faint">
                    No events of this kind yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
