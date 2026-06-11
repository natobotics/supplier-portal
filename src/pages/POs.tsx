import { useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  Receipt,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { Card, CardHeader, StatusBadge, Button } from '../components/ui'
import { purchaseOrders, invoices, supplierById, suppliers } from '../data'
import { fmtMoney, fmtDateShort, cls } from '../utils'
import { PEOPLE } from '../types'
import type { POLine, POStatus, POUnit, PurchaseOrder, SupplierSegment } from '../types'

const poStatusMap: Record<POStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'border border-dashed border-line bg-canvas text-ink-soft' },
  issued: { label: 'Issued', cls: 'bg-info-soft text-secondary' },
  partially_billed: { label: 'Partially billed', cls: 'bg-[#ede9fe] text-[#6d28d9]' },
  fully_billed: { label: 'Fully billed', cls: 'bg-accent-soft text-accent' },
  closed: { label: 'Closed', cls: 'border border-line bg-canvas text-ink-faint' },
}

const segmentLabel: Record<SupplierSegment, string> = {
  subcontractor: 'Sub-contractor',
  freelancer: 'Freelancer',
  it_services: 'IT services',
}

const step2Role: Record<SupplierSegment, string> = {
  subcontractor: 'HR',
  freelancer: 'Line Manager',
  it_services: 'Budget Owner',
}

const unitLabel: Record<POUnit, string> = {
  hour: 'per hour',
  day: 'per day',
  month: 'per month',
  fixed: 'fixed',
}

function rateLabel(rate: number, unit: POUnit): string {
  return unit === 'fixed' ? `${fmtMoney(rate)} fixed` : `${fmtMoney(rate)}/${unit}`
}

interface DraftLine {
  description: string
  rate: string
  unit: POUnit
  qty: string
}

const emptyLine = (): DraftLine => ({ description: '', rate: '', unit: 'hour', qty: '' })

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'
const labelCls = 'mb-1 block text-xs font-medium text-ink-soft'

export function POs() {
  const [pos, setPos] = useState<PurchaseOrder[]>(purchaseOrders)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [successNumber, setSuccessNumber] = useState<string | null>(null)

  // form state
  const [supplierId, setSupplierId] = useState('')
  const [title, setTitle] = useState('')
  const [costCenter, setCostCenter] = useState('')
  const [budgetOwner, setBudgetOwner] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyLine()])

  const nonDraft = pos.filter((p) => p.status !== 'draft')
  const openCount = pos.filter((p) => p.status === 'issued' || p.status === 'partially_billed').length
  const committed = nonDraft.reduce((s, p) => s + p.notToExceed, 0)
  const billed = nonDraft.reduce((s, p) => s + p.billedToDate, 0)
  const remaining = committed - billed

  const lineAmount = (l: DraftLine) => (Number(l.rate) || 0) * (Number(l.qty) || 0)
  const validLines = draftLines.filter(
    (l) => l.description.trim() !== '' && Number(l.rate) > 0 && Number(l.qty) > 0,
  )
  const draftTotal = draftLines.reduce((s, l) => s + lineAmount(l), 0)
  const canSubmit =
    supplierId !== '' &&
    title.trim() !== '' &&
    costCenter.trim() !== '' &&
    budgetOwner !== '' &&
    startDate !== '' &&
    endDate !== '' &&
    validLines.length > 0

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  const nextNumber = () => {
    const max = pos.reduce((m, p) => {
      const n = parseInt(p.number.split('-')[2], 10)
      return Number.isNaN(n) ? m : Math.max(m, n)
    }, 0)
    return `PO-2026-${String(max + 2).padStart(4, '0')}`
  }

  const resetForm = () => {
    setSupplierId('')
    setTitle('')
    setCostCenter('')
    setBudgetOwner('')
    setStartDate('')
    setEndDate('')
    setDraftLines([emptyLine()])
  }

  const updateLine = (idx: number, patch: Partial<DraftLine>) =>
    setDraftLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)))

  const handleCreate = () => {
    if (!canSubmit) return
    const number = nextNumber()
    const lines: POLine[] = validLines.map((l) => ({
      description: l.description.trim(),
      rate: Number(l.rate),
      unit: l.unit,
      qty: Number(l.qty),
      amount: Math.round(Number(l.rate) * Number(l.qty) * 100) / 100,
    }))
    const notToExceed = lines.reduce((s, l) => s + l.amount, 0)
    const newPO: PurchaseOrder = {
      id: `po-${number.toLowerCase()}`,
      number,
      supplierId,
      title: title.trim(),
      budgetOwner,
      costCenter: costCenter.trim(),
      startDate,
      endDate,
      lines,
      notToExceed,
      billedToDate: 0,
      status: 'issued',
    }
    setPos((prev) => [newPO, ...prev])
    setSuccessNumber(number)
    resetForm()
    setFormOpen(false)
    setExpandedId(newPO.id)
  }

  const kpis = [
    { label: 'Open POs', value: String(openCount), sub: 'issued or partially billed', icon: ClipboardList },
    { label: 'Total committed', value: fmtMoney(committed), sub: 'not-to-exceed, non-draft', icon: FileText },
    { label: 'Billed to date', value: fmtMoney(billed), sub: `${committed > 0 ? Math.round((billed / committed) * 100) : 0}% of commitment drawn`, icon: Receipt },
    { label: 'Remaining balance', value: fmtMoney(remaining), sub: 'available to invoice', icon: Wallet },
  ]

  return (
    <div className="space-y-5 p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Commitments and drawdown across {pos.length} purchase orders
        </p>
        <Button onClick={() => setFormOpen((o) => !o)}>
          <Plus size={14} aria-hidden="true" /> New purchase order
        </Button>
      </div>

      {/* Success banner */}
      {successNumber && (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <p className="flex-1 text-sm text-ink">
            Purchase order <span className="font-mono font-semibold">{successNumber}</span> issued —
            invoices can now be matched against it.
          </p>
          <button
            onClick={() => setSuccessNumber(null)}
            aria-label="Dismiss"
            className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-1.5 text-ink-faint">
              <k.icon size={14} aria-hidden="true" />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <p className="tabular mt-2 font-mono text-xl font-semibold text-ink">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* New PO form */}
      {formOpen && (
        <Card className="border-primary/30">
          <CardHeader
            title="New purchase order"
            subtitle="Issued immediately on creation — invoices route AP → segment approver → Finance Head → CEO"
            action={
              <span className="tabular rounded-full bg-canvas px-2.5 py-1 font-mono text-[11px] font-medium text-ink-soft">
                {nextNumber()}
              </span>
            }
          />
          <div className="space-y-4 p-5 pt-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="po-supplier" className={labelCls}>
                  Supplier
                </label>
                <select
                  id="po-supplier"
                  className={cls(inputCls, 'cursor-pointer')}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="" disabled>
                    Select supplier…
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {segmentLabel[s.segment]}
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {segmentLabel[selectedSupplier.segment]} — step 2 approval routes to{' '}
                    {step2Role[selectedSupplier.segment]}: AP → {step2Role[selectedSupplier.segment]} →
                    Finance Head → CEO
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="po-title" className={labelCls}>
                  Title
                </label>
                <input
                  id="po-title"
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Cloud migration support — phase 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="po-cc" className={labelCls}>
                  Cost center
                </label>
                <input
                  id="po-cc"
                  type="text"
                  className={inputCls}
                  placeholder="e.g. CC-320 · Cloud Platform"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="po-owner" className={labelCls}>
                  Budget owner
                </label>
                <select
                  id="po-owner"
                  className={cls(inputCls, 'cursor-pointer')}
                  value={budgetOwner}
                  onChange={(e) => setBudgetOwner(e.target.value)}
                >
                  <option value="" disabled>
                    Select budget owner…
                  </option>
                  {Object.values(PEOPLE).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="po-start" className={labelCls}>
                  Start date
                </label>
                <input
                  id="po-start"
                  type="date"
                  className={inputCls}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="po-end" className={labelCls}>
                  End date
                </label>
                <input
                  id="po-end"
                  type="date"
                  className={inputCls}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line editor */}
            <div className="rounded-lg border border-line bg-canvas p-3.5">
              <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_100px_110px_72px_100px_28px] gap-2 text-[11px] font-medium tracking-wide text-ink-faint uppercase sm:grid">
                <span>Description</span>
                <span>Rate</span>
                <span>Unit</span>
                <span>Qty</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              <div className="space-y-2">
                {draftLines.map((l, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_100px_110px_72px_100px_28px]"
                  >
                    <input
                      type="text"
                      aria-label={`Line ${idx + 1} description`}
                      className={cls(inputCls, 'col-span-2 sm:col-span-1')}
                      placeholder="Line description"
                      value={l.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Line ${idx + 1} rate`}
                      className={inputCls}
                      placeholder="Rate"
                      value={l.rate}
                      onChange={(e) => updateLine(idx, { rate: e.target.value })}
                    />
                    <select
                      aria-label={`Line ${idx + 1} unit`}
                      className={cls(inputCls, 'cursor-pointer')}
                      value={l.unit}
                      onChange={(e) => updateLine(idx, { unit: e.target.value as POUnit })}
                    >
                      {(Object.keys(unitLabel) as POUnit[]).map((u) => (
                        <option key={u} value={u}>
                          {unitLabel[u]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`Line ${idx + 1} quantity`}
                      className={inputCls}
                      placeholder="Qty"
                      value={l.qty}
                      onChange={(e) => updateLine(idx, { qty: e.target.value })}
                    />
                    <span className="tabular text-right font-mono text-[13px] font-medium text-ink">
                      {fmtMoney(lineAmount(l))}
                    </span>
                    <button
                      onClick={() => setDraftLines((ls) => ls.filter((_, i) => i !== idx))}
                      disabled={draftLines.length === 1}
                      aria-label={`Remove line ${idx + 1}`}
                      className="cursor-pointer justify-self-end text-ink-faint transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <Button variant="ghost" onClick={() => setDraftLines((ls) => [...ls, emptyLine()])}>
                  <Plus size={14} aria-hidden="true" /> Add line
                </Button>
                <p className="text-sm text-ink-soft">
                  Not to exceed{' '}
                  <span className="tabular ml-1.5 font-mono text-base font-semibold text-ink">
                    {fmtMoney(draftTotal)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm()
                  setFormOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canSubmit}>
                <FileText size={14} aria-hidden="true" /> Issue purchase order
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* PO list */}
      <div className="space-y-3">
        {pos.map((po) => {
          const supplier = supplierById(po.supplierId)
          const expanded = expandedId === po.id
          const pct = po.notToExceed > 0 ? Math.round((po.billedToDate / po.notToExceed) * 100) : 0
          const barColor = pct >= 90 ? 'bg-danger' : pct >= 75 ? 'bg-warn' : 'bg-accent'
          const linked = invoices.filter((i) => i.poId === po.id)
          const status = poStatusMap[po.status]
          return (
            <Card key={po.id}>
              <button
                onClick={() => setExpandedId(expanded ? null : po.id)}
                aria-expanded={expanded}
                className="flex w-full cursor-pointer flex-wrap items-center gap-4 px-5 py-4 text-left"
              >
                <ChevronRight
                  size={15}
                  aria-hidden="true"
                  className={cls('shrink-0 text-ink-faint transition-transform duration-200', expanded && 'rotate-90')}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-ink">{po.number}</span>
                    <span className={cls('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', status.cls)}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium text-ink">{po.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {supplier.name} · {po.budgetOwner} · {po.costCenter} ·{' '}
                    {fmtDateShort(po.startDate)} – {fmtDateShort(po.endDate)}
                  </p>
                </div>
                <div className="w-full sm:w-56">
                  <div className="flex items-baseline justify-between text-[11px] text-ink-faint">
                    <span>
                      <span className="tabular font-mono font-medium text-ink-soft">{pct}%</span> drawn
                    </span>
                    <span>
                      <span className="tabular font-mono font-medium text-ink-soft">
                        {fmtMoney(po.notToExceed - po.billedToDate)}
                      </span>{' '}
                      remaining
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={cls('h-full rounded-full', barColor)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="tabular mt-1 text-right font-mono text-[11px] text-ink-faint">
                    {fmtMoney(po.billedToDate)} / {fmtMoney(po.notToExceed)}
                  </p>
                </div>
              </button>

              {expanded && (
                <div className="space-y-4 border-t border-line px-5 py-4">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                      PO lines
                    </p>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-line text-[11px] tracking-wide text-ink-faint uppercase">
                          <th className="pb-2 pr-3 font-medium">Description</th>
                          <th className="pb-2 pr-3 font-medium">Rate</th>
                          <th className="pb-2 pr-3 text-right font-medium">Qty</th>
                          <th className="pb-2 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {po.lines.map((l, i) => (
                          <tr key={i} className="text-[13px]">
                            <td className="py-2.5 pr-3 text-ink">{l.description}</td>
                            <td className="tabular py-2.5 pr-3 font-mono text-ink-soft">
                              {rateLabel(l.rate, l.unit)}
                            </td>
                            <td className="tabular py-2.5 pr-3 text-right font-mono text-ink-soft">
                              {l.qty}
                            </td>
                            <td className="tabular py-2.5 text-right font-mono font-medium text-ink">
                              {fmtMoney(l.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                      Linked invoices
                    </p>
                    {linked.length > 0 ? (
                      <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
                        {linked.map((inv) => (
                          <li key={inv.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                            <Receipt size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />
                            <span className="font-mono text-[13px] font-medium text-ink">{inv.number}</span>
                            <span className="text-[11px] text-ink-faint">
                              received {fmtDateShort(inv.receivedDate)} · due {fmtDateShort(inv.dueDate)}
                            </span>
                            <span className="tabular ml-auto font-mono text-[13px] font-semibold text-ink">
                              {fmtMoney(inv.amount)}
                            </span>
                            <StatusBadge status={inv.status} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-line bg-canvas px-3.5 py-3 text-center text-xs text-ink-faint">
                        No invoices billed against this PO yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
