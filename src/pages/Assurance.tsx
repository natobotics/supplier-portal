import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileDown } from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { invoices, clientPOs, entities, supplierById, entityById } from '../data'
import { fmtMoney, fmtGBP, toGBP, convert, daysOverdue, cls } from '../utils'
import { useEntity } from '../context'
import type { Invoice } from '../types'

const PERIODS = [
  { id: 'may', label: 'May 2026 (closed)', end: '2026-05-31' },
  { id: 'jun', label: 'June 2026 (open)', end: '2026-06-30' },
] as const

type PeriodId = (typeof PERIODS)[number]['id']

const CHECKLIST = [
  'All supplier invoices captured',
  'All billable AP mapped to client POs',
  'Credit notes applied',
  'IR35 inside-engagements verified',
  'FX rates locked for close',
  'Entity sign-off complete',
]

export function Assurance() {
  const { entity } = useEntity()
  const [period, setPeriod] = useState<PeriodId>('jun')
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [internalised, setInternalised] = useState<Record<string, boolean>>({})
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false))

  const periodEnd = PERIODS.find((p) => p.id === period)!.end

  // Apply this session's mappings / internal re-classifications on top of the data
  const effective: Invoice[] = invoices.map((i) => ({
    ...i,
    clientPoId: assigned[i.id] ?? i.clientPoId,
    costType: internalised[i.id] ? 'internal' : i.costType,
  }))

  const scoped = effective.filter(
    (i) => i.receivedDate <= periodEnd && (entity === 'all' || i.entityId === entity),
  )
  const docs = scoped.filter((i) => i.docType === 'invoice')
  const billable = docs.filter((i) => i.costType === 'billable')
  const mappedCount = billable.filter((i) => i.clientPoId).length
  const score = billable.length ? Math.round((mappedCount / billable.length) * 100) : 100
  const exceptions = billable.filter((i) => !i.clientPoId)
  const internals = docs.filter((i) => i.costType === 'internal')

  // Group total in GBP; entity total converts each document-currency invoice
  // into the entity's functional currency before summing.
  const scopedCurrency = entityById(entity)?.currency ?? 'GBP'
  const billableTotalGBP = billable.reduce((s, i) => s + toGBP(i.amount, i.currency), 0)
  const billableTotalEntity = billable.reduce(
    (s, i) => s + convert(i.amount, i.currency, scopedCurrency),
    0,
  )

  const coverage = entities
    .filter((e) => entity === 'all' || e.id === entity)
    .map((e) => {
      const eDocs = docs.filter((i) => i.entityId === e.id)
      const eBillable = eDocs.filter((i) => i.costType === 'billable')
      const eMapped = eBillable.filter((i) => i.clientPoId).length
      return {
        entity: e,
        count: eDocs.length,
        // Mixed document currencies → entity functional currency
        total: eDocs.reduce((s, i) => s + convert(i.amount, i.currency, e.currency), 0),
        pct: eBillable.length ? Math.round((eMapped / eBillable.length) * 100) : 100,
      }
    })
    .filter((c) => c.count > 0)

  const checkedCount = checks.filter(Boolean).length
  const allChecked = checkedCount === CHECKLIST.length

  return (
    <div className="space-y-5 p-6">
      {/* Header — period + assurance score */}
      <Card>
        <CardHeader
          title="Month-end AP assurance"
          subtitle="Every billable supplier invoice mapped to a client PO before close"
          action={
            <div className="flex rounded-lg border border-line bg-canvas p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cls(
                    'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200',
                    period === p.id ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4 p-5 pt-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
              Assurance score
            </p>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span
                className={cls(
                  'tabular font-mono text-3xl font-semibold',
                  score === 100 ? 'text-accent' : 'text-warn',
                )}
              >
                {score}%
              </span>
              <span className="text-xs text-ink-faint">
                {mappedCount} of {billable.length} billable invoices mapped
              </span>
            </div>
            <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-line">
              <div
                className={cls('h-full rounded-full', score === 100 ? 'bg-accent' : 'bg-warn')}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
              Billable AP in period
            </p>
            <p className="mt-1 tabular font-mono text-xl font-semibold text-ink">
              {entity === 'all'
                ? fmtGBP(billableTotalGBP)
                : fmtMoney(billableTotalEntity, scopedCurrency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
              Open exceptions
            </p>
            <p
              className={cls(
                'mt-1 tabular font-mono text-xl font-semibold',
                exceptions.length === 0 ? 'text-accent' : 'text-danger',
              )}
            >
              {exceptions.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Coverage per entity */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {coverage.map((c) => (
          <Card key={c.entity.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold text-ink">{c.entity.name}</p>
              {c.pct === 100 ? (
                <CheckCircle2 size={16} className="shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 text-warn" aria-hidden="true" />
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              {c.count} invoice{c.count === 1 ? '' : 's'} · {c.entity.currency}
            </p>
            <p className="mt-2 tabular font-mono text-lg font-semibold text-ink">
              {fmtMoney(c.total, c.entity.currency)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className={cls(
                    'block h-full rounded-full',
                    c.pct === 100 ? 'bg-accent' : 'bg-warn',
                  )}
                  style={{ width: `${c.pct}%` }}
                />
              </span>
              <span className="tabular text-[11px] font-medium text-ink-soft">{c.pct}% mapped</span>
            </div>
          </Card>
        ))}
        {coverage.length === 0 && (
          <Card className="p-4 sm:col-span-2 xl:col-span-3">
            <p className="text-center text-sm text-ink-faint">No invoices in this period.</p>
          </Card>
        )}
      </div>

      {/* Exceptions — unmapped billable AP */}
      <Card>
        <CardHeader
          title="Exceptions — unmapped billable AP"
          subtitle="Billable supplier invoices with no client PO behind them"
          action={
            exceptions.length > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-medium text-danger">
                <AlertTriangle size={11} aria-hidden="true" /> {exceptions.length} to resolve
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
                <CheckCircle2 size={11} aria-hidden="true" /> All mapped
              </span>
            )
          }
        />
        {exceptions.length > 0 ? (
          <div className="overflow-x-auto px-5 pb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[11px] font-medium tracking-wide text-ink-faint uppercase">
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Supplier</th>
                  <th className="py-2 pr-4 font-medium">Entity</th>
                  <th className="py-2 pr-4 text-right font-medium">Amount</th>
                  <th className="py-2 pr-4 text-right font-medium">Age</th>
                  <th className="py-2 pr-4 font-medium">Suggested action</th>
                  <th className="py-2 font-medium">Resolve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exceptions.map((inv) => {
                  const s = supplierById(inv.supplierId)
                  return (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-mono text-[13px] font-medium whitespace-nowrap text-ink">
                        {inv.number}
                      </td>
                      <td className="py-3 pr-4 text-[13px] text-ink">{s.name}</td>
                      <td className="py-3 pr-4 text-xs whitespace-nowrap text-ink-soft">
                        {entityById(inv.entityId)?.name ?? inv.entityId}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <p className="tabular font-mono text-[13px] font-semibold whitespace-nowrap text-ink">
                          {fmtMoney(inv.amount, inv.currency)}
                        </p>
                        <p className="tabular font-mono text-[11px] whitespace-nowrap text-ink-faint">
                          {fmtGBP(toGBP(inv.amount, inv.currency))}
                        </p>
                      </td>
                      <td className="tabular py-3 pr-4 text-right font-mono text-[13px] whitespace-nowrap text-ink-soft">
                        {daysOverdue(inv.receivedDate)}d
                      </td>
                      <td className="py-3 pr-4 text-xs text-ink-soft">
                        Map to client PO or mark internal
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Map ${inv.number} to client PO`}
                            defaultValue=""
                            onChange={(e) => {
                              const v = e.target.value
                              if (v) setAssigned((prev) => ({ ...prev, [inv.id]: v }))
                            }}
                            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                          >
                            <option value="" disabled>
                              Map to client PO…
                            </option>
                            {clientPOs.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.number} — {c.client}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="secondary"
                            className="px-2.5! py-1.5! text-xs!"
                            onClick={() =>
                              setInternalised((prev) => ({ ...prev, [inv.id]: true }))
                            }
                          >
                            Mark internal
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 px-5 pt-1 pb-6 text-sm text-accent">
            <CheckCircle2 size={15} aria-hidden="true" /> All billable AP mapped to client POs —
            nothing to resolve in this period.
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Internal costs */}
        <Card>
          <CardHeader
            title="Internal costs"
            subtitle="No client PO required — internal cost"
          />
          {internals.length > 0 ? (
            <ul className="divide-y divide-line px-5 pb-3">
              {internals.map((inv) => {
                const s = supplierById(inv.supplierId)
                return (
                  <li key={inv.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-medium text-ink">
                        {inv.number}{' '}
                        <span className="font-sans font-normal text-ink-soft">· {s.name}</span>
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        No client PO required — internal cost
                      </p>
                    </div>
                    <span className="tabular font-mono text-xs font-semibold whitespace-nowrap text-ink">
                      {fmtMoney(inv.amount, inv.currency)}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-5 pt-1 pb-5 text-sm text-ink-faint">
              No internal costs in this period.
            </p>
          )}
        </Card>

        {/* Sign-off checklist */}
        <Card>
          <CardHeader
            title="Close sign-off checklist"
            subtitle="The monthly ritual — tick every box before the pack goes out"
          />
          <div className="space-y-2 px-5 pt-1">
            {CHECKLIST.map((label, idx) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-canvas px-3.5 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={checks[idx]}
                  onChange={() =>
                    setChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                  }
                  className="size-4 accent-primary"
                />
                <span
                  className={cls(
                    'text-[13px]',
                    checks[idx] ? 'font-medium text-ink' : 'text-ink-soft',
                  )}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
          {allChecked ? (
            <div className="m-5 mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-accent-soft px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-accent" aria-hidden="true" />
              <p className="flex-1 text-[13px] font-medium text-accent">
                May close ready — assurance pack exportable
              </p>
              <Button>
                <FileDown size={14} aria-hidden="true" /> Export PDF
              </Button>
            </div>
          ) : (
            <p className="px-5 pt-3 pb-4 text-xs text-ink-faint">
              {checkedCount} of {CHECKLIST.length} sign-off steps complete
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
