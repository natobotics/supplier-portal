import { useState } from 'react'
import {
  Wallet,
  FileText,
  Receipt,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Info,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { costCenterBudgets, purchaseOrders, invoices, supplierById } from '../data'
import { PEOPLE, type CostCenterBudget, type PurchaseOrder } from '../types'
import { fmtGBP, fmtMoney, toGBP, cls } from '../utils'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-primary'

const poCurrency = (po: PurchaseOrder) => supplierById(po.supplierId).currency

const isOpenPO = (po: PurchaseOrder) => po.status === 'issued' || po.status === 'partially_billed'

// Non-PO internal spend (hardware, cloud, software) — attributed to CC-600 · IT Operations.
// Internal invoices that carry a poId are already counted via their PO's billedToDate.
const internalActualGBP = invoices
  .filter((i) => i.docType === 'invoice' && i.costType === 'internal' && !i.poId)
  .reduce((sum, i) => sum + toGBP(i.amount, i.currency), 0)

interface CentreStats {
  pos: PurchaseOrder[]
  internal: boolean
  actualGBP: number
  committedGBP: number
  remainingGBP: number
  burn: number // (actual + committed) / budget
}

function centreStats(budget: CostCenterBudget): CentreStats {
  const pos = purchaseOrders.filter((po) => po.costCenter === budget.costCenter)
  const internal = pos.length === 0 && budget.costCenter.startsWith('CC-600')
  const actualGBP = internal
    ? internalActualGBP
    : pos.reduce((sum, po) => sum + toGBP(po.billedToDate, poCurrency(po)), 0)
  const nteGBP = pos.reduce((sum, po) => sum + toGBP(po.notToExceed, poCurrency(po)), 0)
  const committedGBP = internal ? 0 : Math.max(0, nteGBP - actualGBP)
  const remainingGBP = budget.fyBudgetGBP - actualGBP - committedGBP
  const burn = budget.fyBudgetGBP > 0 ? (actualGBP + committedGBP) / budget.fyBudgetGBP : 0
  return { pos, internal, actualGBP, committedGBP, remainingGBP, burn }
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub: string
  icon: typeof Wallet
  tone?: 'neutral' | 'danger'
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <Icon
          size={16}
          className={tone === 'danger' ? 'text-danger' : 'text-ink-faint'}
          aria-hidden="true"
        />
      </div>
      <p className="tabular mt-2 font-mono text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-faint">{sub}</p>
    </Card>
  )
}

function CentreCard({ budget }: { budget: CostCenterBudget }) {
  const [showPOs, setShowPOs] = useState(false)
  const s = centreStats(budget)
  const burnPct = Math.round(s.burn * 100)
  const pct = (n: number) => (budget.fyBudgetGBP > 0 ? (n / budget.fyBudgetGBP) * 100 : 0)
  const actualW = Math.min(100, pct(s.actualGBP))
  const committedW = Math.min(100 - actualW, pct(s.committedGBP))

  return (
    <Card>
      <CardHeader
        title={budget.costCenter}
        subtitle={`Owner: ${budget.owner}${s.internal ? ' · internal costs — no POs' : ''}`}
        action={
          <div className="text-right">
            <p className="tabular font-mono text-sm font-semibold text-ink">
              {fmtGBP(budget.fyBudgetGBP)}
            </p>
            <p className="text-[10px] text-ink-faint">FY26 budget</p>
          </div>
        }
      />
      <div className="space-y-3 p-5 pt-3">
        {s.burn > 1 ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg bg-danger-soft px-3.5 py-2 text-xs font-medium text-danger"
          >
            <AlertTriangle size={13} aria-hidden="true" />
            Over budget — {burnPct}% committed
          </div>
        ) : s.burn >= 0.85 ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg bg-warn-soft px-3.5 py-2 text-xs font-medium text-warn"
          >
            <AlertTriangle size={13} aria-hidden="true" />
            Approaching budget — {burnPct}% committed
          </div>
        ) : null}

        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-line"
          role="img"
          aria-label={`${budget.costCenter}: ${burnPct}% of FY26 budget committed`}
        >
          <div className="flex h-full">
            <div className="h-full bg-primary" style={{ width: `${actualW}%` }} />
            <div className="h-full bg-secondary/60" style={{ width: `${committedW}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> Actual (billed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary/60" aria-hidden="true" /> Committed
            (not yet billed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-line" aria-hidden="true" /> Headroom
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg border border-line bg-canvas px-3.5 py-2.5">
          <div>
            <p className="text-[11px] text-ink-faint">Actual</p>
            <p className="tabular font-mono text-sm font-semibold text-ink">
              {fmtGBP(s.actualGBP)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">Committed</p>
            <p className="tabular font-mono text-sm font-semibold text-ink">
              {fmtGBP(s.committedGBP)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">Remaining</p>
            <p
              className={cls(
                'tabular font-mono text-sm font-semibold',
                s.remainingGBP < 0 ? 'text-danger' : 'text-ink',
              )}
            >
              {fmtGBP(s.remainingGBP)}
            </p>
          </div>
        </div>

        {s.pos.length > 0 ? (
          <div className="space-y-2">
            <button
              type="button"
              aria-expanded={showPOs}
              onClick={() => setShowPOs((v) => !v)}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-ink-soft transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {showPOs ? (
                <ChevronUp size={13} aria-hidden="true" />
              ) : (
                <ChevronDown size={13} aria-hidden="true" />
              )}
              {showPOs ? 'Hide POs' : `Show POs (${s.pos.length})`}
            </button>
            {showPOs && (
              <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
                {s.pos.map((po) => {
                  const sup = supplierById(po.supplierId)
                  return (
                    <li key={po.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                      <span className="font-mono text-xs font-medium text-ink">{po.number}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-ink-faint">
                        {sup.name}
                      </span>
                      <span className="tabular font-mono text-xs text-ink-soft">
                        {fmtMoney(po.billedToDate, sup.currency)} /{' '}
                        {fmtMoney(po.notToExceed, sup.currency)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-ink-faint">
            {s.internal
              ? 'Actuals from internal invoices (hardware, cloud, software) — no POs raised.'
              : 'No POs linked to this cost centre yet.'}
          </p>
        )}
      </div>
    </Card>
  )
}

export function Budgets() {
  const [budgets, setBudgets] = useState<CostCenterBudget[]>(costCenterBudgets)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [owner, setOwner] = useState<string>(PEOPLE.financeHead)
  const [amount, setAmount] = useState('')

  const openPOs = purchaseOrders.filter(isOpenPO)
  const totalBudgetGBP = budgets.reduce((sum, b) => sum + b.fyBudgetGBP, 0)
  const committedGBP = openPOs.reduce((sum, po) => sum + toGBP(po.notToExceed, poCurrency(po)), 0)
  const actualsGBP = openPOs.reduce((sum, po) => sum + toGBP(po.billedToDate, poCurrency(po)), 0)
  const hotCentres = budgets.filter((b) => centreStats(b).burn >= 0.85).length

  const amountNum = Number(amount)
  const canAdd = name.trim().length > 0 && Number.isFinite(amountNum) && amountNum > 0

  function addBudget() {
    if (!canAdd) return
    setBudgets((prev) => [
      ...prev,
      { id: `bud-new-${prev.length + 1}`, costCenter: name.trim(), owner, fyBudgetGBP: amountNum },
    ])
    setName('')
    setAmount('')
    setShowForm(false)
  }

  return (
    <div className="space-y-5 p-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi
          label="Total FY26 budget"
          value={fmtGBP(totalBudgetGBP)}
          sub={`${budgets.length} cost centres · group GBP`}
          icon={Wallet}
        />
        <Kpi
          label="Committed"
          value={fmtGBP(committedGBP)}
          sub="Open PO not-to-exceed"
          icon={FileText}
        />
        <Kpi
          label="Actuals"
          value={fmtGBP(actualsGBP)}
          sub="Billed to date on open POs"
          icon={Receipt}
        />
        <Kpi
          label="Centres over 85% burn"
          value={String(hotCentres)}
          sub={hotCentres > 0 ? 'Needs budget-owner attention' : 'All centres within plan'}
          icon={AlertTriangle}
          tone={hotCentres > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <Info size={13} aria-hidden="true" />
          Committed = open PO not-to-exceed. Actuals = billed to date. Group view in GBP.
        </p>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} aria-hidden="true" /> Add budget
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Add cost-centre budget" subtitle="FY26 · group reporting in GBP" />
          <div className="flex flex-wrap items-end gap-3 p-5 pt-2">
            <label className="block min-w-56 flex-1">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Cost centre name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CC-510 · Data & Analytics"
                className={inputCls}
              />
            </label>
            <label className="block min-w-44">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Owner</span>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={cls(inputCls, 'cursor-pointer')}
              >
                {Object.values(PEOPLE).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block w-40">
              <span className="mb-1 block text-xs font-medium text-ink-soft">FY budget (GBP)</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                className={cls(inputCls, 'font-mono')}
              />
            </label>
            <Button onClick={addBudget} disabled={!canAdd}>
              Add budget
            </Button>
          </div>
        </Card>
      )}

      {/* Per-cost-centre cards */}
      <div className="grid gap-5 xl:grid-cols-2">
        {budgets.map((b) => (
          <CentreCard key={b.id} budget={b} />
        ))}
      </div>
    </div>
  )
}
