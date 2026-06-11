import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  XCircle,
  AlertTriangle,
  FileText,
  FileMinus,
  Sparkles,
  ShieldAlert,
  Copy,
  TrendingUp,
  Landmark,
  UserPlus,
  Gauge,
} from 'lucide-react'
import { Card, CardHeader, StatusBadge, MatchBadge, ConfidenceBar, Button } from '../components/ui'
import { supplierById, poById, invoices, entityById, clientPoById } from '../data'
import { fmtMoney, fmtDate, daysOverdue, cls, toGBP, fmtGBP } from '../utils'
import { validateInvoice, complianceSummary, supplierTaxId } from '../compliance/rules'
import type { CheckStatus } from '../compliance/rules'
import type { Invoice, AnomalyType } from '../types'

const anomalyIcon: Record<AnomalyType, typeof Copy> = {
  duplicate: Copy,
  price_drift: TrendingUp,
  bank_change: Landmark,
  new_supplier: UserPlus,
  round_amount: AlertTriangle,
  po_overrun: Gauge,
}

const verdictPill: Record<
  ReturnType<typeof complianceSummary>['verdict'],
  { label: string; cls: string }
> = {
  compliant: { label: 'Compliant', cls: 'bg-accent-soft text-accent' },
  review: { label: 'Needs review', cls: 'bg-warn-soft text-warn' },
  non_compliant: { label: 'Non-compliant', cls: 'bg-danger-soft text-danger' },
}

const checkIcon: Record<CheckStatus, { Icon: typeof CheckCircle2; cls: string }> = {
  pass: { Icon: CheckCircle2, cls: 'text-accent' },
  warn: { Icon: AlertTriangle, cls: 'text-warn' },
  fail: { Icon: XCircle, cls: 'text-danger' },
}

export function InvoiceDetail({ invoice, onBack }: { invoice: Invoice; onBack: () => void }) {
  const s = supplierById(invoice.supplierId)
  const over = invoice.status !== 'paid' && daysOverdue(invoice.dueDate) > 0
  const ts = invoice.timesheet
  const po = invoice.poId ? poById(invoice.poId) : undefined
  const poRate = po?.lines[0]?.rate
  const poPct = po ? Math.round((po.billedToDate / po.notToExceed) * 100) : 0
  const poRemaining = po ? po.notToExceed - po.billedToDate - invoice.amount : 0
  const unconfirmedHrs = 8
  const isCreditNote = invoice.docType === 'credit_note'
  const linkedInvoice = invoice.linkedInvoiceId
    ? invoices.find((i) => i.id === invoice.linkedInvoiceId)
    : undefined
  const billingEntity = entityById(invoice.entityId)
  const clientPo = invoice.clientPoId ? clientPoById(invoice.clientPoId) : undefined
  const complianceChecks = billingEntity ? validateInvoice(invoice, s, billingEntity) : []
  const verdict = complianceSummary(complianceChecks).verdict
  const taxReg = supplierTaxId(s.id)

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to invoices"
            className="cursor-pointer rounded-lg border border-line bg-surface p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-lg font-semibold text-ink">{invoice.number}</h1>
              <StatusBadge status={invoice.status} />
              <MatchBadge status={invoice.matchStatus} />
            </div>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {s.name} · {fmtMoney(invoice.amount, invoice.currency)}
              {invoice.currency !== 'GBP' && (
                <span className="text-[11px] text-ink-faint">
                  {' '}
                  · ≈ {fmtGBP(toGBP(invoice.amount, invoice.currency))}
                </span>
              )}{' '}
              · due {fmtDate(invoice.dueDate)}
              {over && (
                <span className="font-medium text-danger"> · {daysOverdue(invoice.dueDate)} days late</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Hold</Button>
          <Button variant="danger">Reject</Button>
          <Button>Approve</Button>
        </div>
      </div>

      {/* Credit note banner */}
      {isCreditNote && (
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-info-soft px-4 py-3">
          <FileMinus size={15} className="shrink-0 text-secondary" aria-hidden="true" />
          <p className="text-[13px] text-ink">
            Credit note — applies against{' '}
            {linkedInvoice ? (
              <span className="font-mono font-medium">{linkedInvoice.number}</span>
            ) : (
              'the original invoice'
            )}
          </p>
        </div>
      )}

      {/* Anomalies */}
      {invoice.anomalies.length > 0 && (
        <div className="space-y-2">
          {invoice.anomalies.map((a, i) => {
            const Icon = anomalyIcon[a.type]
            return (
              <div
                key={i}
                role="alert"
                className={cls(
                  'flex items-start gap-3 rounded-lg border px-4 py-3',
                  a.severity === 'high'
                    ? 'border-danger/30 bg-danger-soft'
                    : 'border-warn/30 bg-warn-soft',
                )}
              >
                <span className={cls('mt-0.5', a.severity === 'high' ? 'text-danger' : 'text-warn')}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className={cls('text-[13px] font-semibold', a.severity === 'high' ? 'text-danger' : 'text-warn')}>
                    {a.type === 'duplicate' && 'Possible duplicate'}
                    {a.type === 'price_drift' && 'Price drift detected'}
                    {a.type === 'bank_change' && 'Bank account change — fraud check'}
                    {a.type === 'new_supplier' && 'New supplier — first invoice'}
                    {a.type === 'round_amount' && 'Round-amount pattern'}
                    {a.type === 'po_overrun' && 'PO balance / timesheet overrun'}
                    <span className="ml-2 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase">
                      {a.severity}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{a.message}</p>
                </div>
                <ShieldAlert size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
              </div>
            )
          })}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left: document + lines */}
        <div className="space-y-4 xl:col-span-2">
          {/* Line items */}
          <Card>
            <CardHeader
              title="Line items"
              subtitle="GL coding suggested by AI — confidence shown per line"
              action={
                <span className="flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-medium text-secondary">
                  <Sparkles size={11} aria-hidden="true" /> Auto-coded
                </span>
              }
            />
            <div className="overflow-x-auto px-5 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                    <th className="py-2 pr-3">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">GL account</th>
                    <th className="py-2 pl-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoice.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="max-w-72 py-2.5 pr-3 text-[13px] text-ink">{l.description}</td>
                      <td className="tabular px-3 py-2.5 text-right font-mono text-[13px] text-ink-soft">
                        {l.qty.toLocaleString()}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right font-mono text-[13px] text-ink-soft">
                        {fmtMoney(l.unitPrice, invoice.currency)}
                      </td>
                      <td
                        className={cls(
                          'tabular px-3 py-2.5 text-right font-mono text-[13px] font-medium',
                          l.amount < 0 ? 'text-danger' : 'text-ink',
                        )}
                      >
                        {fmtMoney(l.amount, invoice.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] whitespace-nowrap text-ink-soft">{l.glCode}</td>
                      <td className="py-2.5 pl-3">
                        <ConfidenceBar value={l.glConfidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <td colSpan={3} className="py-2.5 pr-3 text-right text-[13px] font-medium text-ink-soft">
                      Total
                    </td>
                    <td
                      className={cls(
                        'tabular px-3 py-2.5 text-right font-mono text-sm font-semibold',
                        invoice.amount < 0 ? 'text-danger' : 'text-ink',
                      )}
                    >
                      {fmtMoney(invoice.amount, invoice.currency)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Extraction */}
          <Card>
            <CardHeader
              title="AI extraction"
              subtitle={`Captured from ${invoice.source} · fields below 90% need human confirmation`}
            />
            <div className="grid gap-x-8 gap-y-3 p-5 pt-2 sm:grid-cols-2">
              {invoice.extraction.map((f) => (
                <div key={f.field} className="flex items-center justify-between gap-4 border-b border-line pb-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">{f.field}</p>
                    <p className="truncate text-[13px] font-medium text-ink">{f.value}</p>
                  </div>
                  <ConfidenceBar value={f.confidence} />
                </div>
              ))}
            </div>
          </Card>

          {/* 3-way match */}
          {invoice.poNumber && (
            <Card>
              <CardHeader title="3-way match" subtitle="Invoice ↔ PO ↔ timesheet/receipt" />
              <div className="grid gap-3 p-5 pt-2 sm:grid-cols-3">
                {[
                  {
                    label: 'Invoice',
                    value: fmtMoney(invoice.amount, invoice.currency),
                    ok: true,
                    note: invoice.number,
                  },
                  {
                    label: 'Purchase order',
                    value:
                      invoice.matchStatus === 'price_variance'
                        ? fmtMoney(invoice.amount * 0.93, invoice.currency)
                        : fmtMoney(invoice.amount, invoice.currency),
                    ok: invoice.matchStatus !== 'price_variance',
                    note: invoice.poNumber,
                  },
                  ts
                    ? {
                        label: 'Timesheet',
                        value:
                          invoice.matchStatus === 'qty_variance'
                            ? `${ts.hours - unconfirmedHrs} of ${ts.hours} hrs approved`
                            : 'Confirmed',
                        ok: invoice.matchStatus !== 'qty_variance',
                        note:
                          invoice.matchStatus === 'qty_variance'
                            ? `${unconfirmedHrs} hrs unconfirmed`
                            : 'hours match approved timesheet',
                      }
                    : {
                        label: 'Goods receipt',
                        value: invoice.matchStatus === 'qty_variance' ? 'Partial (91%)' : 'Complete',
                        ok: invoice.matchStatus !== 'qty_variance',
                        note: invoice.matchStatus === 'qty_variance' ? '200 units unconfirmed' : 'All lines received',
                      },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={cls(
                      'rounded-lg border p-3.5',
                      m.ok ? 'border-line bg-canvas' : 'border-danger/30 bg-danger-soft',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">{m.label}</span>
                      {m.ok ? (
                        <CheckCircle2 size={15} className="text-accent" aria-label="Matched" />
                      ) : (
                        <XCircle size={15} className="text-danger" aria-label="Variance" />
                      )}
                    </div>
                    <p className="tabular mt-1.5 font-mono text-base font-semibold text-ink">{m.value}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{m.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Country compliance */}
          {billingEntity && (
            <Card>
              <CardHeader
                title="Country compliance"
                subtitle={`${billingEntity.country} processing rules`}
                action={
                  <span
                    className={cls(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
                      verdictPill[verdict].cls,
                    )}
                  >
                    {verdictPill[verdict].label}
                  </span>
                }
              />
              <ul className="divide-y divide-line px-5 pb-4">
                {taxReg && (
                  <li className="flex items-start gap-2.5 py-2.5">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">Supplier tax registration</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {taxReg.kind} <span className="font-mono">{taxReg.id}</span> on file
                      </p>
                    </div>
                  </li>
                )}
                {complianceChecks.map((c) => {
                  const ic = checkIcon[c.status]
                  return (
                    <li key={c.id} className="flex items-start gap-2.5 py-2.5">
                      <ic.Icon size={15} className={cls('mt-0.5 shrink-0', ic.cls)} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-ink">
                          {c.label}
                          {c.severity === 'required' && (
                            <span className="text-[10px] font-medium tracking-wide text-ink-faint uppercase">
                              required
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-faint">{c.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* Right: approvals + supplier + discount */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Approval workflow" subtitle="Fixed 4-level chain — every invoice" />
            <ol className="space-y-0 px-5 pb-5">
              {invoice.approvals.map((step, i) => (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < invoice.approvals.length - 1 && (
                    <span className="absolute top-6 left-[9px] h-full w-px bg-line" aria-hidden="true" />
                  )}
                  <span className="relative z-10 mt-0.5">
                    {step.status === 'approved' ? (
                      <CheckCircle2 size={19} className="text-accent" aria-label="Approved" />
                    ) : step.status === 'rejected' ? (
                      <XCircle size={19} className="text-danger" aria-label="Rejected" />
                    ) : step.status === 'pending' ? (
                      <span className="flex h-[19px] w-[19px] items-center justify-center">
                        <span className="h-3 w-3 animate-pulse rounded-full bg-warn" aria-label="Pending" />
                      </span>
                    ) : (
                      <Circle size={19} className="text-line" aria-label="Waiting" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{step.approver}</p>
                    <p className="text-[11px] text-ink-faint">
                      {step.role}
                      {step.date && ` · ${fmtDate(step.date)}`}
                      {step.status === 'pending' && ' · awaiting action'}
                    </p>
                    {step.comment && (
                      <p className="mt-1 rounded-md bg-canvas px-2.5 py-1.5 text-xs leading-relaxed text-ink-soft">
                        {step.comment}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader title="Billing" subtitle="Entity, cost type and client PO mapping" />
            <div className="px-5 pb-5 text-[13px]">
              <dl className="space-y-2 text-ink-soft">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-faint">Entity</dt>
                  <dd className="font-medium text-ink">{billingEntity?.name ?? invoice.entityId}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-faint">Cost type</dt>
                  <dd>
                    <span
                      className={cls(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                        invoice.costType === 'billable'
                          ? 'bg-accent-soft text-accent'
                          : 'border border-line bg-canvas text-ink-soft',
                      )}
                    >
                      {invoice.costType}
                    </span>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-ink-faint">Client PO</dt>
                  {clientPo ? (
                    <dd className="text-right">
                      <span className="font-mono text-[13px] font-medium text-ink">{clientPo.number}</span>
                      <span className="block text-[11px] text-ink-faint">{clientPo.client}</span>
                    </dd>
                  ) : invoice.costType === 'billable' ? (
                    <dd className="text-right text-xs font-medium text-warn">
                      Not mapped — assign in Month-end
                    </dd>
                  ) : (
                    <dd className="text-ink-faint">—</dd>
                  )}
                </div>
              </dl>
            </div>
          </Card>

          {invoice.discount && (
            <Card className="border-accent/30 bg-accent-soft/40">
              <div className="p-5">
                <p className="text-[11px] font-semibold tracking-wide text-accent uppercase">
                  Early-pay discount
                </p>
                <p className="tabular mt-1 font-mono text-xl font-semibold text-ink">
                  {fmtMoney(invoice.discount.amount)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {invoice.discount.terms} — pay by {fmtDate(invoice.discount.deadline)} to capture.
                </p>
                <Button className="mt-3 w-full">Schedule early payment</Button>
              </div>
            </Card>
          )}

          {ts && (
            <Card>
              <CardHeader title="Timesheet" subtitle="Submitted with this invoice" />
              <div className="px-5 pb-5 text-[13px]">
                <dl className="space-y-1.5 text-ink-soft">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">Service period</dt>
                    <dd className="font-medium text-ink">{ts.period}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">Hours</dt>
                    <dd>
                      {ts.hours > 0 ? (
                        <span className="tabular font-mono">{ts.hours}</span>
                      ) : (
                        'Day-rate engagement'
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">Rate</dt>
                    <dd className="tabular font-mono">
                      {fmtMoney(ts.rate)}
                      {ts.hours > 0 ? '/hr' : '/day'}
                    </dd>
                  </div>
                  {ts.hours > 0 && (
                    <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                      <dt className="text-ink-faint">
                        {ts.hours} hrs × {fmtMoney(ts.rate)}
                      </dt>
                      <dd className="tabular font-mono font-medium text-ink">
                        {fmtMoney(ts.hours * ts.rate)}
                      </dd>
                    </div>
                  )}
                </dl>
                {poRate !== undefined &&
                  (ts.rate > poRate ? (
                    <p className="mt-2.5 flex items-center gap-1.5 rounded-md bg-danger-soft px-2.5 py-1.5 text-xs font-medium text-danger">
                      <XCircle size={13} aria-hidden="true" /> above PO rate {fmtMoney(poRate)}
                    </p>
                  ) : (
                    <p className="mt-2.5 flex items-center gap-1.5 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent">
                      <CheckCircle2 size={13} aria-hidden="true" /> matches PO rate
                    </p>
                  ))}
              </div>
            </Card>
          )}

          {po && (
            <Card>
              <CardHeader title="Purchase order" subtitle="Budget drawdown against NTE" />
              <div className="space-y-3 px-5 pb-5 text-[13px]">
                <div>
                  <p className="font-mono text-[13px] font-semibold text-ink">{po.number}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{po.title}</p>
                </div>
                <dl className="space-y-1.5 text-ink-soft">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">Budget owner</dt>
                    <dd>{po.budgetOwner}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">Cost center</dt>
                    <dd>{po.costCenter}</dd>
                  </div>
                </dl>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-ink-faint">
                    <span>Billed to date</span>
                    <span className="tabular font-mono">
                      {fmtMoney(po.billedToDate)} / {fmtMoney(po.notToExceed)} · {poPct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={cls('h-full rounded-full', poPct > 90 ? 'bg-danger' : 'bg-primary')}
                      style={{ width: `${Math.min(poPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                  <span className="text-ink-faint">Remaining after this invoice</span>
                  <span
                    className={cls(
                      'tabular font-mono font-medium',
                      poRemaining < 0 ? 'text-danger' : 'text-ink',
                    )}
                  >
                    {fmtMoney(poRemaining)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Supplier" />
            <div className="space-y-2.5 px-5 pb-5 text-[13px]">
              <p className="font-medium text-ink">{s.name}</p>
              <dl className="space-y-1.5 text-ink-soft">
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Terms</dt>
                  <dd>{s.paymentTerms}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Method</dt>
                  <dd>{s.paymentMethod}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Avg days to pay</dt>
                  <dd className="tabular font-mono">{s.avgPayDays}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">YTD spend</dt>
                  <dd className="tabular font-mono">{fmtMoney(s.ytdSpend)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Open balance</dt>
                  <dd className="tabular font-mono">{fmtMoney(s.openBalance)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 p-4">
              <span className="rounded-lg bg-canvas p-2.5 text-ink-faint">
                <FileText size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{invoice.number}.pdf</p>
                <p className="text-[11px] text-ink-faint">Original document · received {fmtDate(invoice.receivedDate)}</p>
              </div>
              <Button variant="secondary">View</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
