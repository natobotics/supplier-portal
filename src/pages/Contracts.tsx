import { Fragment, useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileWarning,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { contracts, invoices, suppliers, supplierById } from '../data'
import type { Contract, ContractType, POUnit } from '../types'
import { fmtMoney, fmtDateShort, daysUntil, cls, TODAY } from '../utils'
import { useEntity } from '../context'

const typeStyles: Record<ContractType, string> = {
  MSA: 'bg-info-soft text-secondary',
  'Rate card': 'bg-accent-soft text-accent',
  SDS: 'bg-warn-soft text-warn',
  SOW: 'border border-line bg-canvas text-ink-soft',
  NDA: 'border border-line bg-canvas text-ink-soft',
}

const statusStyles: Record<Contract['status'], { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-accent-soft text-accent' },
  expiring: { label: 'Expiring', cls: 'bg-warn-soft text-warn' },
  expired: { label: 'Expired', cls: 'bg-danger-soft text-danger' },
  missing: { label: 'Missing', cls: 'bg-danger-soft text-danger' },
}

const unitSuffix: Record<POUnit, string> = {
  hour: 'hr',
  day: 'day',
  month: 'mo',
  fixed: 'fixed',
}

const CONTRACT_TYPES: ContractType[] = ['MSA', 'Rate card', 'SDS', 'SOW', 'NDA']

interface RateAlert {
  key: string
  invoiceNumber: string
  supplierName: string
  billed: number
  contracted: number
  pct: number
  currency: string
  unit: POUnit
  contractTitle: string
}

function ExpiryChip({ contract }: { contract: Contract }) {
  if (!contract.expiry) {
    return <span className="text-[11px] text-ink-faint">—</span>
  }
  const d = daysUntil(contract.expiry)
  const danger = d < 0 || contract.status === 'expired'
  const warn = !danger && d <= 60
  return (
    <span
      className={cls(
        'tabular inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap',
        danger
          ? 'bg-danger-soft text-danger'
          : warn
            ? 'bg-warn-soft text-warn'
            : 'border border-line bg-canvas text-ink-soft',
      )}
    >
      {d < 0 ? `Expired ${-d}d ago` : `${d}d left`}
    </span>
  )
}

export function Contracts() {
  const { entity } = useEntity()
  const [rows, setRows] = useState<Contract[]>(contracts)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [queueDone, setQueueDone] = useState<Record<string, boolean>>({})
  const [showForm, setShowForm] = useState(false)
  const [uploaded, setUploaded] = useState<string | null>(null)

  // Upload form fields
  const [formSupplier, setFormSupplier] = useState('')
  const [formType, setFormType] = useState<ContractType>('MSA')
  const [formTitle, setFormTitle] = useState('')
  const [formEffective, setFormEffective] = useState(TODAY.toISOString().slice(0, 10))
  const [formExpiry, setFormExpiry] = useState('')

  const visible = useMemo(
    () => rows.filter((c) => entity === 'all' || supplierById(c.supplierId).entityId === entity),
    [rows, entity],
  )

  const visibleSuppliers = useMemo(
    () => suppliers.filter((s) => entity === 'all' || s.entityId === entity),
    [entity],
  )

  // RATE GUARD — cross-check timesheet invoices against contracted rate cards
  const rateAlerts = useMemo(() => {
    const alerts: RateAlert[] = []
    for (const c of visible) {
      if (!c.rateCard || c.rateCard.length === 0) continue
      const supplierInvoices = invoices.filter(
        (i) => i.supplierId === c.supplierId && i.timesheet !== undefined,
      )
      for (const inv of supplierInvoices) {
        const billed = inv.timesheet!.rate
        // compare against the closest rate-card line; flag when off by >1%
        let best = c.rateCard[0]
        let bestDiff = Math.abs(billed - best.rate) / best.rate
        for (const line of c.rateCard) {
          const diff = Math.abs(billed - line.rate) / line.rate
          if (diff < bestDiff) {
            best = line
            bestDiff = diff
          }
        }
        if (bestDiff > 0.01) {
          alerts.push({
            key: `${c.id}-${inv.id}`,
            invoiceNumber: inv.number,
            supplierName: supplierById(c.supplierId).name,
            billed,
            contracted: best.rate,
            pct: ((billed - best.rate) / best.rate) * 100,
            currency: best.currency,
            unit: best.unit,
            contractTitle: c.title,
          })
        }
      }
    }
    return alerts
  }, [visible])

  const activeCount = visible.filter((c) => c.status === 'active').length
  const expiringSoon = visible.filter(
    (c) =>
      c.status !== 'expired' &&
      c.expiry !== undefined &&
      daysUntil(c.expiry) >= 0 &&
      daysUntil(c.expiry) <= 60,
  ).length
  const missingCount = visible.filter((c) => c.status === 'missing').length

  const queue = visible.filter((c) => c.status === 'expiring' || c.status === 'missing')

  const formValid = formSupplier !== '' && formTitle.trim() !== '' && formEffective !== ''

  function resetForm() {
    setFormSupplier('')
    setFormType('MSA')
    setFormTitle('')
    setFormEffective(TODAY.toISOString().slice(0, 10))
    setFormExpiry('')
  }

  function submitUpload() {
    if (!formValid) return
    const next: Contract = {
      id: `ctr-new-${rows.length + 1}`,
      supplierId: formSupplier,
      type: formType,
      title: formTitle.trim(),
      effective: formEffective,
      expiry: formExpiry || undefined,
      status: 'active',
    }
    setRows((prev) => [...prev, next])
    setUploaded(`${next.title} — ${supplierById(next.supplierId).name}`)
    setShowForm(false)
    resetForm()
  }

  const kpis = [
    {
      label: 'Active contracts',
      value: activeCount,
      icon: FileText,
      tone: 'text-accent',
      bg: 'bg-accent-soft',
    },
    {
      label: 'Expiring ≤ 60 days',
      value: expiringSoon,
      icon: CalendarClock,
      tone: expiringSoon > 0 ? 'text-warn' : 'text-ink-faint',
      bg: expiringSoon > 0 ? 'bg-warn-soft' : 'bg-canvas',
    },
    {
      label: 'Missing documents',
      value: missingCount,
      icon: FileWarning,
      tone: missingCount > 0 ? 'text-danger' : 'text-ink-faint',
      bg: missingCount > 0 ? 'bg-danger-soft' : 'bg-canvas',
    },
    {
      label: 'Rate-mismatch alerts',
      value: rateAlerts.length,
      icon: ShieldAlert,
      tone: rateAlerts.length > 0 ? 'text-danger' : 'text-ink-faint',
      bg: rateAlerts.length > 0 ? 'bg-danger-soft' : 'bg-canvas',
    },
  ]

  return (
    <div className="space-y-5 p-6">
      {/* KPI strip */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="flex items-center gap-3.5 p-4">
            <span className={cls('rounded-lg p-2.5', k.bg, k.tone)}>
              <k.icon size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="tabular font-mono text-xl font-semibold text-ink">{k.value}</p>
              <p className="text-[11px] text-ink-faint">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* RATE GUARD */}
      <Card className={rateAlerts.length > 0 ? 'border-danger/30' : undefined}>
        <CardHeader
          title="Rate guard"
          subtitle="Every timesheet invoice is cross-checked against the contracted rate card (>1% tolerance)"
          action={
            <span
              className={cls(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                rateAlerts.length > 0 ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent',
              )}
            >
              <ShieldAlert size={11} aria-hidden="true" />
              {rateAlerts.length > 0
                ? `${rateAlerts.length} violation${rateAlerts.length === 1 ? '' : 's'}`
                : 'All clear'}
            </span>
          }
        />
        <div className="space-y-2.5 p-5 pt-2">
          {rateAlerts.map((a) => (
            <div
              key={a.key}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3"
            >
              <ShieldAlert size={15} className="shrink-0 text-danger" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">
                  <span className="font-mono">{a.invoiceNumber}</span> billed{' '}
                  <span className="tabular font-mono font-semibold text-danger">
                    {fmtMoney(a.billed, a.currency)}/{unitSuffix[a.unit]}
                  </span>{' '}
                  vs contracted{' '}
                  <span className="tabular font-mono font-semibold">
                    {fmtMoney(a.contracted, a.currency)}/{unitSuffix[a.unit]}
                  </span>{' '}
                  ({a.pct > 0 ? '+' : ''}
                  {a.pct.toFixed(1)}%) — {a.contractTitle}
                </p>
                <p className="text-[11px] text-ink-faint">{a.supplierName}</p>
              </div>
            </div>
          ))}
          {rateAlerts.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-faint">
              No rate mismatches — all timesheet invoices bill at contracted rates.
            </p>
          )}
        </div>
      </Card>

      {/* Upload form */}
      {showForm && (
        <Card>
          <CardHeader
            title="Upload contract"
            subtitle="Register a signed document against a supplier"
            action={
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            }
          />
          <div className="space-y-4 p-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ct-supplier" className="text-xs font-medium text-ink-soft">
                  Supplier
                </label>
                <select
                  id="ct-supplier"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-primary"
                >
                  <option value="">Select supplier…</option>
                  {visibleSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ct-type" className="text-xs font-medium text-ink-soft">
                  Contract type
                </label>
                <select
                  id="ct-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ContractType)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-primary"
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ct-title" className="text-xs font-medium text-ink-soft">
                  Title
                </label>
                <input
                  id="ct-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Master services agreement — cloud support"
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary"
                />
              </div>
              <div>
                <label htmlFor="ct-effective" className="text-xs font-medium text-ink-soft">
                  Effective date
                </label>
                <input
                  id="ct-effective"
                  type="date"
                  value={formEffective}
                  onChange={(e) => setFormEffective(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-primary"
                />
              </div>
              <div>
                <label htmlFor="ct-expiry" className="text-xs font-medium text-ink-soft">
                  Expiry date (optional)
                </label>
                <input
                  id="ct-expiry"
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-primary"
                />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-line bg-canvas px-4 py-8 text-center">
              <Upload size={18} className="text-ink-faint" aria-hidden="true" />
              <p className="text-[13px] font-medium text-ink-soft">
                Drag the signed PDF here, or click to browse
              </p>
              <p className="text-[11px] text-ink-faint">Demo stub — no file leaves your browser</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={submitUpload} disabled={!formValid}>
                <Upload size={14} aria-hidden="true" /> Add to repository
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Repository */}
      <Card>
        <CardHeader
          title="Contract repository"
          subtitle="MSAs, rate cards, SDS determinations and supporting documents"
          action={
            !showForm ? (
              <Button onClick={() => setShowForm(true)}>
                <Upload size={14} aria-hidden="true" /> Upload contract
              </Button>
            ) : undefined
          }
        />
        <div className="p-5 pt-2">
          {uploaded && (
            <div
              role="status"
              className="mb-3 flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-2.5 text-[13px] text-accent"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>
                <span className="font-semibold">Contract added</span> — {uploaded}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[11px] tracking-wide text-ink-faint uppercase">
                  <th className="w-8 py-2 pr-2 font-medium">
                    <span className="sr-only">Expand</span>
                  </th>
                  <th className="py-2 pr-4 font-medium">Supplier</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Effective → Expiry</th>
                  <th className="py-2 pr-4 font-medium">Days to expiry</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((c) => {
                  const s = supplierById(c.supplierId)
                  const hasDetail = (c.rateCard !== undefined && c.rateCard.length > 0) || c.note !== undefined
                  const open = expanded[c.id] === true
                  return (
                    <Fragment key={c.id}>
                      <tr className="text-[13px]">
                        <td className="py-3 pr-2">
                          {hasDetail && (
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={`Toggle details — ${c.title}`}
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                              }
                              className="cursor-pointer rounded p-1 text-ink-faint transition-colors duration-200 hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              <ChevronRight
                                size={14}
                                aria-hidden="true"
                                className={cls('transition-transform duration-200', open && 'rotate-90')}
                              />
                            </button>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium whitespace-nowrap text-ink">{s.name}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cls(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                              typeStyles[c.type],
                            )}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-ink-soft">{c.title}</td>
                        <td className="py-3 pr-4 whitespace-nowrap text-ink-soft">
                          {fmtDateShort(c.effective)} →{' '}
                          {c.expiry ? fmtDateShort(c.expiry) : <span className="text-ink-faint">No expiry</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <ExpiryChip contract={c} />
                        </td>
                        <td className="py-3">
                          <span
                            className={cls(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                              statusStyles[c.status].cls,
                            )}
                          >
                            {statusStyles[c.status].label}
                          </span>
                        </td>
                      </tr>
                      {open && hasDetail && (
                        <tr>
                          <td colSpan={7} className="py-3 pr-4 pl-8">
                            <div className="rounded-lg border border-line bg-canvas px-4 py-3">
                              {c.rateCard && c.rateCard.length > 0 && (
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="text-[10px] tracking-wide text-ink-faint uppercase">
                                      <th className="py-1 pr-4 font-medium">Role</th>
                                      <th className="py-1 font-medium">Contracted rate</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {c.rateCard.map((l) => (
                                      <tr key={l.role} className="text-[13px]">
                                        <td className="py-1 pr-4 text-ink">{l.role}</td>
                                        <td className="tabular py-1 font-mono font-medium text-ink">
                                          {fmtMoney(l.rate, l.currency)}/{unitSuffix[l.unit]}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              {c.note && (
                                <p className={cls('text-[11px] text-ink-faint', c.rateCard && 'mt-2')}>
                                  {c.note}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-faint">No contracts for this entity.</p>
          )}
        </div>
      </Card>

      {/* Expiry & gaps queue */}
      <Card>
        <CardHeader
          title="Expiry & gaps queue"
          subtitle="Renewals to kick off and signed documents to chase"
        />
        <ul className="divide-y divide-line px-5 pb-3">
          {queue.map((c) => {
            const s = supplierById(c.supplierId)
            const isExpiring = c.status === 'expiring'
            const done = queueDone[c.id] === true
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <span
                  className={cls(
                    'rounded-lg p-2.5',
                    isExpiring ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger',
                  )}
                >
                  {isExpiring ? (
                    <CalendarClock size={16} aria-hidden="true" />
                  ) : (
                    <FileWarning size={16} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    {s.name} — {c.title}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {c.expiry
                      ? `Expires ${fmtDateShort(c.expiry)} · ${daysUntil(c.expiry)} days away`
                      : 'No signed copy on file'}
                    {c.note ? ` · ${c.note}` : ''}
                  </p>
                </div>
                {done ? (
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-accent">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {isExpiring ? 'Renewal started' : 'Chase sent'}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setQueueDone((prev) => ({ ...prev, [c.id]: true }))}
                  >
                    {isExpiring ? 'Start renewal' : 'Chase document'}
                  </Button>
                )}
              </li>
            )
          })}
          {queue.length === 0 && (
            <li className="py-4 text-center text-sm text-ink-faint">
              No renewals due or document gaps for this entity.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
