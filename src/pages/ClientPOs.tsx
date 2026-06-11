import { useState } from 'react'
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Percent,
  Plus,
  Receipt,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { Card, CardHeader, Button, StatusBadge } from '../components/ui'
import { clientPOs, invoices, purchaseOrders, entities, entityById, supplierById } from '../data'
import { fmtMoney, fmtGBP, toGBP, cls } from '../utils'
import { useEntity } from '../context'
import type { ClientPO } from '../types'

const statusPill: Record<ClientPO['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-accent-soft text-accent' },
  closed: { label: 'Closed', cls: 'bg-canvas text-ink-soft border border-line' },
}

function marginColor(pct: number): string {
  if (pct >= 30) return 'text-accent'
  if (pct >= 15) return 'text-warn'
  return 'text-danger'
}

// supplier cost mapped to a client PO, in GBP (billable docs only; credit notes net off)
function mappedCostGBP(clientPoId: string): number {
  return invoices
    .filter((i) => i.costType === 'billable' && i.clientPoId === clientPoId)
    .reduce((s, i) => s + toGBP(i.amount, i.currency), 0)
}

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-offset-0 focus:outline-primary'

const emptyForm = {
  number: '',
  client: '',
  engagement: '',
  entityId: 'ent-uk',
  currency: 'GBP',
  value: '',
}

export function ClientPOs() {
  const { entity } = useEntity()
  const [rows, setRows] = useState<ClientPO[]>(clientPOs)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [imported, setImported] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const visible = entity === 'all' ? rows : rows.filter((r) => r.entityId === entity)

  // ---- KPIs (computed over the visible register) ----
  const openCount = visible.filter((r) => r.status === 'open').length
  const totalValueGBP = visible.reduce((s, r) => s + toGBP(r.value, r.currency), 0)
  const costByRow = visible.map((r) => ({ row: r, costGBP: mappedCostGBP(r.id) }))
  const mappedCostTotal = costByRow.reduce((s, c) => s + c.costGBP, 0)
  const mappedPairs = costByRow.filter((c) =>
    invoices.some((i) => i.costType === 'billable' && i.clientPoId === c.row.id),
  )
  const mappedValueGBP = mappedPairs.reduce((s, c) => s + toGBP(c.row.value, c.row.currency), 0)
  const mappedCostGBPSum = mappedPairs.reduce((s, c) => s + c.costGBP, 0)
  const grossMarginPct =
    mappedValueGBP > 0 ? ((mappedValueGBP - mappedCostGBPSum) / mappedValueGBP) * 100 : 0

  const formValid =
    form.number.trim() !== '' &&
    form.client.trim() !== '' &&
    form.currency.trim() !== '' &&
    Number(form.value) > 0

  function addClientPO() {
    if (!formValid) return
    const row: ClientPO = {
      id: `cpo-new-${Date.now()}`,
      number: form.number.trim(),
      client: form.client.trim(),
      engagement: form.engagement.trim() || '—',
      entityId: form.entityId,
      currency: form.currency.trim().toUpperCase(),
      value: Number(form.value),
      status: 'open',
    }
    setRows((prev) => [...prev, row])
    setForm(emptyForm)
    setShowForm(false)
    setBanner(`Client PO ${row.number} added to the register.`)
  }

  function importDemoRows() {
    if (imported) return
    const ts = Date.now()
    const demo: ClientPO[] = [
      {
        id: `cpo-imp-${ts}-1`,
        number: 'NRD-2026-11',
        client: 'Nordia Bank',
        entityId: 'ent-sg',
        currency: 'SGD',
        value: 18000,
        engagement: 'Q3 smart hands extension',
        status: 'open',
      },
      {
        id: `cpo-imp-${ts}-2`,
        number: 'GLX-4488',
        client: 'Globex',
        entityId: 'ent-de',
        currency: 'EUR',
        value: 22000,
        engagement: 'Globex platform phase 3',
        status: 'open',
      },
    ]
    setRows((prev) => [...prev, ...demo])
    setImported(true)
    setBanner('2 rows imported')
  }

  const kpis = [
    {
      label: 'Open client POs',
      value: String(openCount),
      icon: Briefcase,
      sub: entity === 'all' ? 'across all entities' : entityById(entity)?.name ?? '',
    },
    {
      label: 'Client PO value',
      value: fmtGBP(totalValueGBP),
      icon: TrendingUp,
      sub: 'group reporting (GBP)',
    },
    {
      label: 'Mapped supplier cost',
      value: fmtGBP(mappedCostTotal),
      icon: Receipt,
      sub: 'billable invoices mapped to client POs',
    },
    {
      label: 'Gross margin',
      value: `${grossMarginPct.toFixed(1)}%`,
      icon: Percent,
      sub: 'mapped pairs only',
      valueCls: marginColor(grossMarginPct),
    },
  ]

  return (
    <div className="space-y-5 p-6">
      {/* KPI strip */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center gap-2 text-ink-faint">
              <k.icon size={15} aria-hidden="true" />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <p className={cls('tabular mt-2 font-mono text-xl font-semibold', k.valueCls ?? 'text-ink')}>
              {k.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Success banner */}
      {banner && (
        <div className="flex items-center gap-2.5 rounded-lg bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
          <CheckCircle2 size={15} aria-hidden="true" />
          <span className="flex-1">{banner}</span>
          <button
            className="cursor-pointer text-xs font-medium text-accent underline-offset-2 hover:underline"
            onClick={() => setBanner(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader title="Add client PO" subtitle="Register the revenue side of an engagement" />
          <div className="grid gap-4 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="cpo-number" className="mb-1 block text-xs font-medium text-ink-soft">
                PO number
              </label>
              <input
                id="cpo-number"
                className={cls(inputCls, 'font-mono')}
                placeholder="ACME-PO-2255"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cpo-client" className="mb-1 block text-xs font-medium text-ink-soft">
                Client
              </label>
              <input
                id="cpo-client"
                className={inputCls}
                placeholder="Acme Industrial"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cpo-engagement" className="mb-1 block text-xs font-medium text-ink-soft">
                Engagement
              </label>
              <input
                id="cpo-engagement"
                className={inputCls}
                placeholder="Network ops support — phase 2"
                value={form.engagement}
                onChange={(e) => setForm({ ...form, engagement: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cpo-entity" className="mb-1 block text-xs font-medium text-ink-soft">
                Billing entity
              </label>
              <select
                id="cpo-entity"
                className={inputCls}
                value={form.entityId}
                onChange={(e) => {
                  const ent = entityById(e.target.value)
                  setForm({ ...form, entityId: e.target.value, currency: ent?.currency ?? form.currency })
                }}
              >
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cpo-currency" className="mb-1 block text-xs font-medium text-ink-soft">
                Currency
              </label>
              <input
                id="cpo-currency"
                className={cls(inputCls, 'font-mono uppercase')}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cpo-value" className="mb-1 block text-xs font-medium text-ink-soft">
                PO value
              </label>
              <input
                id="cpo-value"
                type="number"
                min="0"
                className={cls(inputCls, 'tabular font-mono')}
                placeholder="50000"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-5 pb-5">
            <Button onClick={addClientPO} disabled={!formValid}>
              <Plus size={14} aria-hidden="true" /> Add to register
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Import CSV stub */}
      {showImport && (
        <Card>
          <CardHeader
            title="Import client POs"
            subtitle="CSV with columns: number, client, entity, currency, value, engagement"
          />
          <div className="px-5 pb-5 pt-1">
            <button
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-canvas px-6 py-10 text-center transition-colors duration-200 hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={importDemoRows}
              disabled={imported}
            >
              <Upload size={18} className="text-ink-faint" aria-hidden="true" />
              <span className="text-sm font-medium text-ink">
                {imported ? 'Import complete' : 'Drop a CSV here, or click to simulate an import'}
              </span>
              <span className="text-xs text-ink-faint">
                {imported
                  ? 'NRD-2026-11 and GLX-4488 added to the register'
                  : 'Demo stub — adds 2 sample rows (Nordia Bank, Globex)'}
              </span>
            </button>
          </div>
        </Card>
      )}

      {/* Register */}
      <Card>
        <CardHeader
          title="Client PO register"
          subtitle="Revenue-side POs mapped against supplier cost"
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowImport((v) => !v)}>
                <Upload size={14} aria-hidden="true" /> Import CSV
              </Button>
              <Button onClick={() => setShowForm((v) => !v)}>
                <Plus size={14} aria-hidden="true" /> Add client PO
              </Button>
            </div>
          }
        />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-medium text-ink-faint uppercase">
                <th className="py-2.5 pr-3" />
                <th className="py-2.5 pr-4">Client PO</th>
                <th className="py-2.5 pr-4">Client</th>
                <th className="py-2.5 pr-4">Engagement</th>
                <th className="py-2.5 pr-4">Entity</th>
                <th className="py-2.5 pr-4 text-right">Value</th>
                <th className="py-2.5 pr-4 text-right">Mapped cost</th>
                <th className="py-2.5 pr-4 text-right">Margin</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((cpo) => {
                const linkedInvoices = invoices.filter(
                  (i) => i.costType === 'billable' && i.clientPoId === cpo.id,
                )
                const linkedPOs = purchaseOrders.filter((p) => p.clientPoId === cpo.id)
                const costGBP = linkedInvoices.reduce((s, i) => s + toGBP(i.amount, i.currency), 0)
                const valueGBP = toGBP(cpo.value, cpo.currency)
                const margin = valueGBP > 0 ? ((valueGBP - costGBP) / valueGBP) * 100 : 0
                const isOpen = expanded === cpo.id
                const ent = entityById(cpo.entityId)
                return (
                  <Row
                    key={cpo.id}
                    cpo={cpo}
                    entName={ent?.name ?? cpo.entityId}
                    valueGBP={valueGBP}
                    costGBP={costGBP}
                    margin={margin}
                    hasMapping={linkedInvoices.length > 0}
                    linkedInvoices={linkedInvoices}
                    linkedPOs={linkedPOs}
                    isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : cpo.id)}
                  />
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-ink-faint">
                    No client POs for this entity.
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

function Row({
  cpo,
  entName,
  valueGBP,
  costGBP,
  margin,
  hasMapping,
  linkedInvoices,
  linkedPOs,
  isOpen,
  onToggle,
}: {
  cpo: ClientPO
  entName: string
  valueGBP: number
  costGBP: number
  margin: number
  hasMapping: boolean
  linkedInvoices: typeof invoices
  linkedPOs: typeof purchaseOrders
  isOpen: boolean
  onToggle: () => void
}) {
  const pill = statusPill[cpo.status]
  return (
    <>
      <tr className="cursor-pointer align-middle hover:bg-canvas" onClick={onToggle}>
        <td className="py-3 pr-3">
          <ChevronRight
            size={14}
            className={cls('text-ink-faint transition-transform duration-200', isOpen && 'rotate-90')}
            aria-hidden="true"
          />
        </td>
        <td className="py-3 pr-4 font-mono text-[13px] font-semibold whitespace-nowrap text-ink">
          {cpo.number}
        </td>
        <td className="py-3 pr-4 whitespace-nowrap text-ink">{cpo.client}</td>
        <td className="max-w-56 truncate py-3 pr-4 text-[13px] text-ink-soft">{cpo.engagement}</td>
        <td className="py-3 pr-4 text-[13px] whitespace-nowrap text-ink-soft">{entName}</td>
        <td className="py-3 pr-4 text-right whitespace-nowrap">
          <span className="tabular block font-mono text-[13px] font-semibold text-ink">
            {fmtMoney(cpo.value, cpo.currency)}
          </span>
          {cpo.currency !== 'GBP' && (
            <span className="tabular font-mono text-[11px] text-ink-faint">{fmtGBP(valueGBP)}</span>
          )}
        </td>
        <td className="tabular py-3 pr-4 text-right font-mono text-[13px] whitespace-nowrap text-ink">
          {hasMapping ? fmtGBP(costGBP) : <span className="text-ink-faint">—</span>}
        </td>
        <td
          className={cls(
            'tabular py-3 pr-4 text-right font-mono text-[13px] font-semibold whitespace-nowrap',
            hasMapping ? marginColor(margin) : 'text-ink-faint',
          )}
        >
          {hasMapping ? `${margin.toFixed(1)}%` : '—'}
        </td>
        <td className="py-3">
          <span className={cls('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium', pill.cls)}>
            {pill.label}
          </span>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={9} className="bg-canvas px-2 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Receipt size={13} aria-hidden="true" /> Linked supplier invoices
                </p>
                {linkedInvoices.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {linkedInvoices.map((inv) => (
                      <li key={inv.id} className="flex flex-wrap items-center gap-3 py-2">
                        <span className="font-mono text-[13px] font-medium text-ink">{inv.number}</span>
                        {inv.docType === 'credit_note' && (
                          <span className="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-secondary">
                            Credit note
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                          {supplierById(inv.supplierId).name}
                        </span>
                        <span className="tabular font-mono text-[13px] font-semibold text-ink">
                          {fmtMoney(inv.amount, inv.currency)}
                        </span>
                        <StatusBadge status={inv.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-2 text-xs text-ink-faint">
                    No supplier invoices mapped to this client PO yet.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <FileText size={13} aria-hidden="true" /> Linked supplier POs
                </p>
                {linkedPOs.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {linkedPOs.map((po) => {
                      const sup = supplierById(po.supplierId)
                      return (
                        <li key={po.id} className="flex flex-wrap items-center gap-3 py-2">
                          <span className="font-mono text-[13px] font-medium text-ink">{po.number}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                            {po.title} · {sup.name}
                          </span>
                          <span className="tabular font-mono text-[13px] text-ink">
                            {fmtMoney(po.billedToDate, sup.currency)}
                            <span className="text-ink-faint">
                              {' '}
                              / {fmtMoney(po.notToExceed, sup.currency)}
                            </span>
                          </span>
                          <span className="text-[11px] text-ink-faint capitalize">
                            {po.status.replace('_', ' ')}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="py-2 text-xs text-ink-faint">No supplier POs linked to this client PO.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
