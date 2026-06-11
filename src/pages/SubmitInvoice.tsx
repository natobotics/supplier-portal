import { Fragment, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileUp,
  Info,
  Lock,
  Paperclip,
  Send,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { suppliers, poBySupplier, poById, supplierById, entityById } from '../data'
import { supplierTaxId } from '../compliance/rules'
import { fmtMoney, fmtDateShort, cls } from '../utils'
import { PEOPLE } from '../types'
import type { ApproverRole, PurchaseOrder, SupplierSegment } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'

const qtyLabels: Record<'hour' | 'day' | 'month', string> = {
  hour: 'Hours',
  day: 'Days',
  month: 'Months',
}

// Step 2 of the fixed 4-level chain routes by supplier segment — never by amount.
function step2For(
  segment: SupplierSegment,
  po: PurchaseOrder,
): { role: ApproverRole; name: string } {
  if (segment === 'subcontractor') return { role: 'HR', name: PEOPLE.hr }
  if (segment === 'freelancer') return { role: 'Line Manager', name: po.budgetOwner }
  return { role: 'Budget Owner', name: po.budgetOwner }
}

function StepChip({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
        done
          ? 'bg-accent-soft text-accent'
          : active
            ? 'bg-info-soft text-secondary'
            : 'border border-line bg-canvas text-ink-faint',
      )}
    >
      {done && <Check size={13} aria-hidden="true" />}
      Step {n} of 3
    </span>
  )
}

export function SubmitInvoice() {
  const [supplierId, setSupplierId] = useState('')
  const [poId, setPoId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [period, setPeriod] = useState('')
  const [qty, setQty] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const resetDetails = () => {
    setInvoiceNumber('')
    setPeriod('')
    setQty('')
    setAmountStr('')
    setFileName(null)
  }
  const resetAll = () => {
    setSupplierId('')
    setPoId('')
    resetDetails()
    setSubmitted(false)
  }
  const pickSupplier = (id: string) => {
    setSupplierId(id)
    setPoId('')
    resetDetails()
  }
  const pickPo = (id: string) => {
    setPoId(id)
    resetDetails()
  }

  const supplier = supplierId ? supplierById(supplierId) : undefined
  const openPos = supplierId ? poBySupplier(supplierId) : []
  const po = poId ? poById(poId) : undefined
  const line = po?.lines[0]
  const qtyUnit = line && line.unit !== 'fixed' ? line.unit : null
  const remaining = po ? po.notToExceed - po.billedToDate : 0

  const taxReg = supplier ? supplierTaxId(supplier.id) : undefined
  const supplierEntity = supplier ? entityById(supplier.entityId) : undefined

  const qtyNum = parseFloat(qty) || 0
  const amount = qtyUnit && line ? qtyNum * line.rate : parseFloat(amountStr) || 0
  const overrun = amount - remaining
  const highHours = qtyUnit === 'hour' && qtyNum > 80
  const canSubmit =
    !!po && invoiceNumber.trim().length > 0 && period.trim().length > 0 && amount > 0

  // ---- Success view ----
  if (submitted && supplier && po) {
    const s2 = step2For(supplier.segment, po)
    const steps: Array<{ role: string; name: string }> = [
      { role: 'AP', name: PEOPLE.ap },
      { role: s2.role, name: s2.name },
      { role: 'Finance Head', name: PEOPLE.financeHead },
      { role: 'CEO', name: PEOPLE.ceo },
    ]
    return (
      <div className="space-y-5 p-6">
        <Card>
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="rounded-full bg-accent-soft p-3 text-accent">
              <CheckCircle2 size={18} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-base font-semibold text-ink">Invoice submitted</h2>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="font-mono">{invoiceNumber.trim()}</span> · {supplier.name} ·{' '}
              <span className="tabular font-mono font-semibold">{fmtMoney(amount)}</span> against{' '}
              <span className="font-mono">{po.number}</span>
            </p>
            {overrun > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                <AlertCircle size={13} aria-hidden="true" />
                Exceeds remaining PO balance by {fmtMoney(overrun)} — flagged{' '}
                <span className="font-mono">po_overrun</span> for AP review
              </p>
            )}

            <p className="mt-7 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Approval chain — 4 steps, every invoice
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {steps.map((st, i) => (
                <Fragment key={st.role}>
                  {i > 0 && (
                    <ChevronRight size={14} className="text-ink-faint" aria-hidden="true" />
                  )}
                  <div className="rounded-lg border border-line bg-canvas px-3.5 py-2 text-center">
                    <p className="text-[11px] font-medium text-ink-faint">
                      {i + 1} · {st.role}
                    </p>
                    <p className="text-[13px] font-medium whitespace-nowrap text-ink">{st.name}</p>
                  </div>
                </Fragment>
              ))}
            </div>

            <p className="mt-6 text-xs text-ink-faint">Track status in the Invoices tab.</p>
            <Button variant="secondary" className="mt-4" onClick={resetAll}>
              Submit another
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ---- Guided flow ----
  return (
    <div className="space-y-5 p-6">
      {/* Step 1 — supplier identity */}
      <Card>
        <CardHeader
          title="Who are you"
          subtitle="Pick the supplier account you are invoicing as"
          action={<StepChip n={1} done={!!supplierId} active={!supplierId} />}
        />
        <div className="space-y-2.5 p-5 pt-2">
          <label className="block max-w-md">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Supplier account</span>
            <select
              value={supplierId}
              onChange={(e) => pickSupplier(e.target.value)}
              className={cls(inputCls, 'cursor-pointer')}
            >
              <option value="" disabled>
                Select your company…
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.category}
                </option>
              ))}
            </select>
          </label>
          <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Info size={13} aria-hidden="true" />
            Production: this comes from the supplier&apos;s login.
          </p>
        </div>
      </Card>

      {/* Step 2 — pick the PO */}
      <Card>
        <CardHeader
          title="Bill against"
          subtitle="Open purchase orders for your account"
          action={<StepChip n={2} done={!!poId} active={!!supplierId && !poId} />}
        />
        <div className="space-y-2.5 p-5 pt-2">
          {!supplier && (
            <p className="py-3 text-sm text-ink-faint">Select a supplier first.</p>
          )}
          {supplier && openPos.length === 0 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-ink-faint">
                No open purchase orders — contact your account manager.
              </p>
              <Button disabled>Continue</Button>
            </div>
          )}
          {supplier &&
            openPos.map((p) => {
              const l = p.lines[0]
              const rem = p.notToExceed - p.billedToDate
              const pct = Math.min(100, Math.round((p.billedToDate / p.notToExceed) * 100))
              const selected = p.id === poId
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickPo(p.id)}
                  className={cls(
                    'w-full cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors duration-200',
                    selected
                      ? 'border-primary bg-info-soft/40'
                      : 'border-line bg-canvas hover:border-ink-faint',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cls(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        selected ? 'border-primary' : 'border-line bg-surface',
                      )}
                      aria-hidden="true"
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">
                        <span className="font-mono font-semibold">{p.number}</span> · {p.title}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {l.unit === 'fixed'
                          ? 'Fixed price'
                          : `${fmtMoney(l.rate)} / ${l.unit}`}
                        {' · '}
                        {fmtDateShort(p.startDate)} – {fmtDateShort(p.endDate)} · billed{' '}
                        {fmtMoney(p.billedToDate)} of {fmtMoney(p.notToExceed)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular font-mono text-sm font-semibold text-ink">
                        {fmtMoney(rem)}
                      </p>
                      <p className="text-[11px] text-ink-faint">remaining</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={cls('h-full rounded-full', pct >= 90 ? 'bg-warn' : 'bg-primary')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
        </div>
      </Card>

      {/* Step 3 — invoice details */}
      <Card>
        <CardHeader
          title="Invoice details"
          subtitle="Rate is locked to the PO — only quantity and references are editable"
          action={<StepChip n={3} done={false} active={!!poId} />}
        />
        <div className="space-y-4 p-5 pt-2">
          {!po && <p className="py-3 text-sm text-ink-faint">Select a purchase order first.</p>}
          {po && line && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-soft">
                    Invoice number
                  </span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className={cls(inputCls, 'font-mono')}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-soft">
                    Service period
                  </span>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="May 25 – Jun 5"
                    className={inputCls}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="mb-1 block text-xs font-medium text-ink-soft">
                    Rate (locked to PO)
                  </span>
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                    <Lock size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                    <span className="tabular font-mono text-sm text-ink">
                      {line.unit === 'fixed'
                        ? 'Fixed-price lines'
                        : `${fmtMoney(line.rate)} / ${line.unit}`}
                    </span>
                  </div>
                </div>
                {qtyUnit ? (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-soft">
                      {qtyLabels[qtyUnit]}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={qtyUnit === 'hour' ? 0.5 : 1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="0"
                      className={cls(inputCls, 'tabular font-mono')}
                    />
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-soft">
                      Amount (USD)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0.00"
                      className={cls(inputCls, 'tabular font-mono')}
                    />
                  </label>
                )}
                <div>
                  <span className="mb-1 block text-xs font-medium text-ink-soft">
                    Invoice amount
                  </span>
                  <div className="rounded-lg border border-line bg-canvas px-3 py-2">
                    <span className="tabular font-mono text-sm font-semibold text-ink">
                      {fmtMoney(amount)}
                    </span>
                    {qtyUnit && qtyNum > 0 && (
                      <span className="ml-1.5 text-[11px] text-ink-faint">
                        = {qtyNum} × {fmtMoney(line.rate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFileName(`${invoiceNumber.trim() || 'invoice-scan'}.pdf`)
                }
                className="w-full cursor-pointer rounded-lg border border-dashed border-line bg-canvas px-4 py-5 text-center transition-colors duration-200 hover:border-ink-faint"
              >
                {fileName ? (
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink">
                    <Paperclip size={14} className="text-accent" aria-hidden="true" />
                    <span className="font-mono">{fileName}</span>
                    <span className="text-ink-faint">· click to replace</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink-faint">
                    <FileUp size={15} aria-hidden="true" />
                    Drop your invoice PDF here, or click to attach
                  </span>
                )}
              </button>

              <div className="space-y-2 rounded-lg border border-line bg-canvas p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                  Live validation
                </p>
                <p className="flex items-start gap-2 text-[13px] text-ink-soft">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span>
                    Rate locked to PO {po.number}
                    {line.unit !== 'fixed' && (
                      <>
                        {' '}
                        — <span className="tabular font-mono">{fmtMoney(line.rate)}</span> per{' '}
                        {line.unit}
                      </>
                    )}
                  </span>
                </p>
                {taxReg ? (
                  <p className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>
                      Tax registration on file ({taxReg.kind}{' '}
                      <span className="font-mono">{taxReg.id}</span>)
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-[13px] text-warn">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      No tax registration on file — invoice will be flagged for{' '}
                      {supplierEntity?.country ?? 'country'} compliance review
                    </span>
                  </p>
                )}
                {amount > 0 &&
                  (overrun > 0 ? (
                    <p className="flex items-start gap-2 text-[13px] text-danger">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>
                        Exceeds remaining balance by{' '}
                        <span className="tabular font-mono font-semibold">
                          {fmtMoney(overrun)}
                        </span>{' '}
                        — will be flagged <span className="font-mono">po_overrun</span>
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>
                        Within remaining PO balance —{' '}
                        <span className="tabular font-mono">{fmtMoney(remaining)}</span> available
                      </span>
                    </p>
                  ))}
                {highHours && (
                  <p className="flex items-start gap-2 text-[13px] text-warn">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{qtyNum} hours — unusually high for a 2-week period</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                {overrun > 0 && amount > 0 && (
                  <span className="text-[11px] text-ink-faint">
                    Overrun invoices are still submittable — AP reviews the flag.
                  </span>
                )}
                <Button disabled={!canSubmit} onClick={() => setSubmitted(true)}>
                  <Send size={14} aria-hidden="true" /> Submit invoice
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
