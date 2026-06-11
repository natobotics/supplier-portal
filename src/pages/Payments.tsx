import { Landmark, Percent, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { paymentBatches, invoices, supplierById } from '../data'
import { fmtMoney, fmtCompact, fmtDate, cls, daysOverdue } from '../utils'

const statusMap = {
  draft: { label: 'Draft', cls: 'bg-canvas text-ink-soft border border-line' },
  pending_release: { label: 'Pending release', cls: 'bg-warn-soft text-warn' },
  released: { label: 'Released', cls: 'bg-info-soft text-secondary' },
  settled: { label: 'Settled', cls: 'bg-accent-soft text-accent' },
}

export function Payments() {
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
              <span className="tabular font-mono text-base font-semibold text-ink">{fmtMoney(b.total)}</span>
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
                <span className="tabular font-mono text-sm font-semibold text-ink">{fmtCompact(b.total)}</span>
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
