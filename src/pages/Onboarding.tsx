import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Info,
  Lock,
  ShieldAlert,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { onboardingCases, entities, entityById } from '../data'
import { useEntity } from '../context'
import { fmtDate, cls, TODAY } from '../utils'
import type { OnboardingCase, OnboardingStep, SupplierSegment } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'

const segmentLabels: Record<SupplierSegment, string> = {
  subcontractor: 'Sub-contractor',
  freelancer: 'Freelancer',
  it_services: 'IT services',
}

const TOTAL_STEPS = 5

function freshSteps(): OnboardingStep[] {
  return [
    { id: 'details', label: 'Company & contact details', status: 'complete' },
    { id: 'tax', label: 'Tax registration (W-9 / W-8 / VAT)', status: 'pending' },
    { id: 'bank', label: 'Bank verification (penny test)', status: 'pending' },
    { id: 'contract', label: 'Contract & rate card', status: 'pending' },
    { id: 'compliance', label: 'Compliance review (IR35 / sanctions)', status: 'pending' },
  ]
}

function daysIn(c: OnboardingCase): number {
  const started = new Date(c.started + 'T00:00:00')
  return Math.max(0, Math.round((TODAY.getTime() - started.getTime()) / 86400000))
}

function doneCount(c: OnboardingCase): number {
  return c.steps.filter((s) => s.status === 'complete').length
}

function isBlocked(c: OnboardingCase): boolean {
  return c.steps.some((s) => s.status === 'blocked')
}

function StepIcon({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'complete')
    return <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
  if (status === 'in_progress')
    return <Clock size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
  if (status === 'blocked')
    return <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
  return <Circle size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
}

function CaseChip({ c }: { c: OnboardingCase }) {
  const done = doneCount(c)
  const style = isBlocked(c)
    ? { label: 'Blocked', cls: 'bg-danger-soft text-danger' }
    : done === TOTAL_STEPS
      ? { label: 'Complete', cls: 'bg-accent-soft text-accent' }
      : { label: 'In progress', cls: 'bg-info-soft text-secondary' }
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        style.cls,
      )}
    >
      {style.label}
    </span>
  )
}

export function Onboarding() {
  const { entity } = useEntity()
  const [cases, setCases] = useState<OnboardingCase[]>(() =>
    onboardingCases.map((c) => ({ ...c, steps: c.steps.map((s) => ({ ...s })) })),
  )

  // Invite form
  const [showInvite, setShowInvite] = useState(false)
  const [fName, setFName] = useState('')
  const [fContact, setFContact] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fSegment, setFSegment] = useState<SupplierSegment>('subcontractor')
  const [fEntity, setFEntity] = useState(entity !== 'all' ? entity : 'ent-uk')
  const [invited, setInvited] = useState<{ name: string; email: string } | null>(null)

  const visible = entity === 'all' ? cases : cases.filter((c) => c.entityId === entity)
  const active = visible.filter((c) => doneCount(c) < TOTAL_STEPS)
  const blocked = visible.filter(isBlocked)
  const avgDays =
    active.length > 0
      ? Math.round(active.reduce((sum, c) => sum + daysIn(c), 0) / active.length)
      : 0

  const markComplete = (caseId: string, stepId: string) => {
    setCases((cs) =>
      cs.map((c) =>
        c.id === caseId
          ? {
              ...c,
              steps: c.steps.map((s) =>
                s.id === stepId ? { ...s, status: 'complete' as const, note: undefined } : s,
              ),
            }
          : c,
      ),
    )
  }

  const canInvite =
    fName.trim().length > 0 && fContact.trim().length > 0 && fEmail.trim().length > 0

  const sendInvite = () => {
    const name = fName.trim()
    const email = fEmail.trim()
    const newCase: OnboardingCase = {
      id: `onb-${Date.now()}`,
      name,
      contactName: fContact.trim(),
      email,
      segment: fSegment,
      entityId: fEntity,
      started: '2026-06-11',
      steps: freshSteps(),
    }
    setCases((cs) => [newCase, ...cs])
    setInvited({ name, email })
    setShowInvite(false)
    setFName('')
    setFContact('')
    setFEmail('')
    setFSegment('subcontractor')
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Supplier onboarding</h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            AP-side pipeline tracker — five gated steps before payment eligibility
          </p>
        </div>
        <Button onClick={() => setShowInvite((v) => !v)}>
          <UserPlus size={14} aria-hidden="true" /> Invite supplier
        </Button>
      </div>

      {/* Invite success banner */}
      {invited && (
        <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-3 text-[13px] font-medium text-accent">
          <CheckCircle2 size={15} aria-hidden="true" />
          Invite sent to {invited.email} — {invited.name} added to the pipeline with details
          pre-filled.
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardHeader
            title="Invite supplier"
            subtitle="Creates an onboarding case — the supplier completes the remaining steps self-serve"
          />
          <div className="space-y-4 p-5 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">
                  Company / individual name
                </span>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Acme Talent Ltd"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">Contact name</span>
                <input
                  type="text"
                  value={fContact}
                  onChange={(e) => setFContact(e.target.value)}
                  placeholder="Jane Doe"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">Email</span>
                <input
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  placeholder="accounts@acmetalent.co.uk"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">Segment</span>
                <select
                  value={fSegment}
                  onChange={(e) => setFSegment(e.target.value as SupplierSegment)}
                  className={cls(inputCls, 'cursor-pointer')}
                >
                  <option value="subcontractor">Sub-contractor</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="it_services">IT services</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-soft">Entity</span>
                <select
                  value={fEntity}
                  onChange={(e) => setFEntity(e.target.value)}
                  className={cls(inputCls, 'cursor-pointer')}
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button disabled={!canInvite} onClick={sendInvite}>
                <UserPlus size={14} aria-hidden="true" /> Send invite
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Active cases
          </p>
          <p className="tabular mt-1 text-2xl font-semibold text-ink">{active.length}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">of {visible.length} in the pipeline</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Blocked cases
          </p>
          <p
            className={cls(
              'tabular mt-1 text-2xl font-semibold',
              blocked.length > 0 ? 'text-danger' : 'text-ink',
            )}
          >
            {blocked.length}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">at least one step blocked</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Avg days in onboarding
          </p>
          <p className="tabular mt-1 text-2xl font-semibold text-ink">{avgDays}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">started date vs today (Jun 11)</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Payment gate
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-danger">
            <Lock size={14} aria-hidden="true" />
            Blocked suppliers cannot be paid
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">gate lifts when all 5 steps complete</p>
        </Card>
      </div>

      {/* Payment gate callout */}
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-danger" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-danger">
            Payment gate — live consequences
          </h2>
        </div>
        <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink">
          <li>
            Cobalt Staffing — invoice <span className="font-mono">CSA-2026-118</span> (
            <span className="tabular font-mono font-semibold">£18,400</span>) held: W-9 missing
          </li>
          <li>
            Bright Umbrella — first invoice will block: SDS missing on inside-IR35{' '}
            <span className="font-mono">PO-2026-0019</span>
          </li>
        </ul>
      </div>

      {/* Case cards */}
      {visible.length === 0 && (
        <Card>
          <p className="px-5 py-8 text-center text-sm text-ink-faint">
            No onboarding cases for this entity.
          </p>
        </Card>
      )}
      {visible.map((c) => {
        const done = doneCount(c)
        const pct = Math.round((done / TOTAL_STEPS) * 100)
        const fully = done === TOTAL_STEPS
        return (
          <Card key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink">{c.name}</h2>
                  <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                    {segmentLabels[c.segment]}
                  </span>
                  <CaseChip c={c} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {entityById(c.entityId)?.name ?? c.entityId} · {c.contactName} ·{' '}
                  {c.email} · started {fmtDate(c.started)} ({daysIn(c)}d in onboarding)
                </p>
              </div>
              <div className="w-44 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-ink-faint">
                  <span>Overall progress</span>
                  <span className="tabular font-medium text-ink-soft">
                    {done}/{TOTAL_STEPS}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={cls('h-full rounded-full', fully ? 'bg-accent' : 'bg-primary')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            {fully && (
              <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-accent">
                <CheckCircle2 size={15} aria-hidden="true" />
                {c.name} fully onboarded — payment eligibility unlocked
              </div>
            )}

            <ul className="px-5 pt-2 pb-3">
              {c.steps.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 border-b border-line py-2.5 last:border-b-0"
                >
                  <StepIcon status={s.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{s.label}</p>
                    {s.note && (
                      <p
                        className={cls(
                          'mt-0.5 text-xs',
                          s.status === 'blocked' ? 'text-danger' : 'text-ink-faint',
                        )}
                      >
                        {s.note}
                      </p>
                    )}
                  </div>
                  {s.status !== 'complete' && (
                    <Button
                      variant="ghost"
                      className="px-2.5 py-1 text-xs"
                      onClick={() => markComplete(c.id, s.id)}
                    >
                      Mark complete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}

      <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Info size={13} aria-hidden="true" />
        Suppliers complete these steps self-serve in production — this is the AP-side tracker.
      </p>
    </div>
  )
}
