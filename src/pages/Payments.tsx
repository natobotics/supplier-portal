import { useState } from 'react'
import { Landmark, Percent, ShieldCheck, ChevronRight, Sparkles, Repeat, CheckCircle2, Coins } from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { paymentBatches, invoices, recurringSchedules, supplierById } from '../data'
import { fmtMoney, fmtDate, fmtGBP, toGBP, cls, daysOverdue } from '../utils'
import { useEntity } from '../context'

const statusMap = {
  draft: { label: 'Draft', cls: 'bg-canvas text-ink-soft border border-line' },
  pending_release: { label: 'Pending release', cls: 'bg-warn-soft text-warn' },
  released: { label: 'Released', cls: 'bg-info-soft text-secondary' },
  settled: { label: 'Settled', cls: 'bg-accent-soft text-accent' },
}

export function Payments() {
  const { entity } = useEntity()
  const [recurringActive, setRecurringActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(recurringSchedules.map((r) => [r.id, r.active])),
  )
  const [draftFor, setDraftFor] = useState<string | null>(null)

  const schedules =
    entity === 'all' ? recurringSchedules : recurringSchedules.filter((r) => r.entityId === entity)

  const discountable = invoices.filter(
    (i) =>
      i.status !== 'paid' &&
      i.status !== 'rejected' &&
      i.discount &&
      daysOverdue(i.discount.deadline) <= 0,
  )
  const totalSavings = discountable.reduce((s, i) => s + (i.discount?.amount ?? 0), 0)
  const upcoming = paymentBatches.filter((b) => b.status !== 'settled')
  const settled = paymentBatches.filter((b) => b.status === 'settled')

  return (
    <div className="space-y-5 p-6">
      {/* Optimizer */}
      <Card className="border-accent/30">
        <CardHeader
          title="Payment timing optimizer"
          subtitle="AI weighs early-pay discounts against cash position and DPO targets"
          action={
            <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
              <Sparkles size={11} aria-hidden="true" /> {fmtMoney(totalSavings)} capturable
            </span>
          }
        />
        <div className="space-y-2.5 p-5 pt-2">
          {discountable.map((inv) => {
            const s = supplierById(inv.supplierId)
            return (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
              >
                <Percent size={15} className="text-accent" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    Pay <span className="font-mono">{inv.number}</span> ({s.name}) by{' '}
                    {fmtDate(inv.discount!.deadline)}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {inv.discount!.terms} · invoice {fmtMoney(inv.amount)} · annualized return ≈{' '}
                    {Math.round(((inv.discount!.amount / inv.amount) * 365 / 20) * 100)}%
                  </p>
                </div>
                <span className="tabular font-mono text-sm font-semibold text-accent">
                  save {fmtMoney(inv.discount!.amount)}
                </span>
                <Button variant="secondary">Add to next run</Button>
              </div>
            )
          })}
          {discountable.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-faint">No capturable discounts right now.</p>
          )}
        </div>
      </Card>

      {/* Recurring invoices */}
      <Card>
        <CardHeader
          title="Recurring invoices"
          subtitle="Retainers auto-draft monthly against their PO"
        />
        <div className="space-y-2.5 p-5 pt-2">
          {draftFor && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-2.5 text-[13px] text-accent"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>
                <span className="font-semibold">Draft created in Capture queue</span> — {draftFor}
              </span>
            </div>
          )}
          {schedules.map((r) => {
            const s = supplierById(r.supplierId)
            const isActive = recurringActive[r.id]
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
              >
                <Repeat size={15} className="text-ink-faint" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{r.description}</p>
                  <p className="text-[11px] text-ink-faint">
                    {s.name} · next run {fmtDate(r.nextRun)}
                  </p>
                </div>
                <span className="tabular font-mono text-sm font-semibold text-ink">
                  {fmtMoney(r.amount, r.currency)}
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label={`Recurring schedule active — ${r.description}`}
                    onClick={() =>
                      setRecurringActive((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                    }
                    className={cls(
                      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      isActive ? 'bg-accent' : 'bg-line',
                    )}
                  >
                    <span
                      className={cls(
                        'absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-surface shadow-sm transition-transform duration-200',
                        isActive && 'translate-x-4',
                      )}
                    />
                  </button>
                  <span
                    className={cls(
                      'w-10 text-[11px] font-medium',
                      isActive ? 'text-accent' : 'text-ink-faint',
                    )}
                  >
                    {isActive ? 'Active' : 'Paused'}
                  </span>
                </span>
                <Button variant="ghost" onClick={() => setDraftFor(r.description)}>
                  Generate draft now
                </Button>
              </div>
            )
          })}
          {schedules.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-faint">
              No recurring schedules for this entity.
            </p>
          )}
        </div>
      </Card>

      {/* FX exposure — AI cash forecast by currency */}
      <Card>
        <CardHeader
          title="FX exposure — upcoming outflow by currency"
          subtitle="AI forecast over open payables · hedge or net before the next payment runs"
          action={
            <span className="flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-medium text-secondary">
              <Sparkles size={11} aria-hidden="true" /> Aprio AI
            </span>
          }
        />
        <div className="grid gap-3 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(
            invoices
              .filter((i) => i.status !== 'paid' && i.status !== 'rejected')
              .reduce<Record<string, number>>((acc, i) => {
                acc[i.currency] = (acc[i.currency] ?? 0) + i.amount
                return acc
              }, {}),
          )
            .map(([ccy, amt]) => ({ ccy, amt, gbp: toGBP(amt, ccy) }))
            .sort((a, b) => b.gbp - a.gbp)
            .map(({ ccy, amt, gbp }) => (
              <div key={ccy} className="rounded-lg border border-line bg-canvas p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-semibold text-ink">{ccy}</span>
                  <Coins size={14} className="text-ink-faint" aria-hidden="true" />
                </div>
                <p className="tabular mt-1.5 font-mono text-base font-semibold text-ink">
                  {fmtMoney(amt, ccy)}
                </p>
                <p className="text-[11px] text-ink-faint">≈ {fmtGBP(gbp)}</p>
              </div>
            ))}
        </div>
        <p className="px-5 pb-4 text-[11px] text-ink-faint">
          Non-GBP exposure settles from entity local accounts where balances allow; the
          remainder routes via Wise multi-currency batch at spot. Rates locked at booking for
          the month-end close.
        </p>
      </Card>

      {/* Upcoming runs */}
      <Card>
        <CardHeader title="Payment runs" subtitle="Batches awaiting release require dual control" action={<Button>New payment run</Button>} />
        <ul className="divide-y divide-line px-5 pb-3">
          {upcoming.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-4 py-3.5">
              <span className="rounded-lg bg-canvas p-2.5 text-ink-faint">
                <Landmark size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[13px] font-semibold text-ink uppercase">{b.id}</p>
                  <span className={cls('rounded-full px-2 py-0.5 text-[11px] font-medium', statusMap[b.status].cls)}>
                    {statusMap[b.status].label}
                  </span>
                </div>
                <p className="text-xs text-ink-faint">
                  {fmtDate(b.runDate)} · {b.invoiceCount} invoices · {b.method}
                  {b.savings > 0 && (
                    <span className="text-accent"> · captures {fmtMoney(b.savings)} in discounts</span>
                  )}
                </p>
              </div>
              <span className="tabular font-mono text-base font-semibold text-ink">
                {fmtMoney(b.total, 'GBP')}{' '}
                <span className="text-[11px] font-normal text-ink-faint">GBP</span>
              </span>
              {b.status === 'pending_release' ? (
                <Button>
                  <ShieldCheck size={14} aria-hidden="true" /> Release
                </Button>
              ) : (
                <Button variant="secondary">
                  Edit <ChevronRight size={14} aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* Controls + history */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payment controls" subtitle="Fraud prevention active on every run" />
          <ul className="space-y-2.5 p-5 pt-2 text-[13px]">
            {[
              'Dual control — releaser must differ from batch creator',
              'Bank detail changes frozen 72h pending out-of-band verification',
              'Positive pay file transmitted to bank on every check run',
              'AI screens every payee against duplicate + sanction lists pre-release',
            ].map((c) => (
              <li key={c} className="flex items-start gap-2.5 rounded-lg border border-line bg-canvas px-3.5 py-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="leading-relaxed text-ink-soft">{c}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Settled runs" subtitle="Last 30 days" />
          <ul className="divide-y divide-line px-5 pb-3">
            {settled.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px] font-medium text-ink uppercase">{b.id}</p>
                  <p className="text-[11px] text-ink-faint">
                    {fmtDate(b.runDate)} · {b.invoiceCount} invoices · saved {fmtMoney(b.savings)}
                  </p>
                </div>
                <span className="tabular font-mono text-sm font-semibold text-ink">
                  {fmtMoney(b.total, 'GBP')}{' '}
                  <span className="text-[10px] font-normal text-ink-faint">GBP</span>
                </span>
                <span className={cls('rounded-full px-2 py-0.5 text-[11px] font-medium', statusMap[b.status].cls)}>
                  Settled
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
