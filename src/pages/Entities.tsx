import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Building2,
  CheckCircle2,
  Globe2,
  History,
  Landmark,
  Pencil,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { entities, invoices, suppliers } from '../data'
import { cls, convert, fmtGBP, fmtMoney, toGBP } from '../utils'
import { useEntity } from '../context'
import type { Entity } from '../types'

const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'PLN', 'AED', 'INR', 'SGD', 'SEK'] as const
const OTHER = '__other__'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-offset-0 focus:outline-primary'

interface ChangeLine {
  id: number
  ts: string
  actor: string
  action: string
}

interface FormState {
  name: string
  country: string
  currencySel: string
  customCurrency: string
  taxRegime: string
}

const emptyForm: FormState = {
  name: '',
  country: '',
  currencySel: 'GBP',
  customCurrency: '',
  taxRegime: '',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function Entities() {
  const { entity } = useEntity()
  const [list, setList] = useState<Entity[]>(entities)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [banner, setBanner] = useState<string | null>(null)
  const [changes, setChanges] = useState<ChangeLine[]>([])

  const logChange = (action: string) =>
    setChanges((prev) => [
      { id: Date.now() + prev.length, ts: 'Just now', actor: 'Sarah Chen (admin)', action },
      ...prev,
    ])

  // ---- KPIs (group-level admin stats) ----
  const activeCount = list.filter((e) => e.active).length
  const countries = new Set(list.filter((e) => e.active).map((e) => e.country)).size
  const supplierCount = (entityId: string) => suppliers.filter((s) => s.entityId === entityId).length
  const topEntity = list.reduce<{ name: string; count: number }>(
    (best, e) => {
      const c = supplierCount(e.id)
      return c > best.count ? { name: e.name, count: c } : best
    },
    { name: '—', count: 0 },
  )
  const groupYtdGBP = suppliers.reduce((sum, s) => sum + toGBP(s.ytdSpend, s.currency), 0)

  // Invoices arrive in many document currencies — convert each to the entity's
  // functional currency before summing.
  const openAP = (entityId: string, entityCcy: string) =>
    invoices
      .filter((i) => i.entityId === entityId && i.status !== 'paid' && i.status !== 'rejected')
      .reduce((sum, i) => sum + convert(i.amount, i.currency, entityCcy), 0)

  // Distinct document currencies this entity's suppliers bill in.
  const txnCurrencies = (entityId: string) =>
    Array.from(new Set(suppliers.filter((s) => s.entityId === entityId).map((s) => s.currency)))

  const rows = entity === 'all' ? list : list.filter((e) => e.id === entity)

  // ---- Mutations ----
  const toggleActive = (id: string) => {
    let line = ''
    setList((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        const next = { ...e, active: !e.active }
        line = `Entity ${next.active ? 'reactivated' : 'deactivated'} — ${next.name} (${next.currency})`
        return next
      }),
    )
    if (line) logChange(line)
  }

  const openAdd = () => {
    if (showForm && !editingId) {
      setShowForm(false)
      return
    }
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (e: Entity) => {
    setEditingId(e.id)
    const preset = (CURRENCY_OPTIONS as readonly string[]).includes(e.currency)
    setForm({
      name: e.name,
      country: e.country,
      currencySel: preset ? e.currency : OTHER,
      customCurrency: preset ? '' : e.currency,
      taxRegime: e.taxRegime,
    })
    setShowForm(true)
    setBanner(null)
  }

  const handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const currency =
      form.currencySel === OTHER ? form.customCurrency.trim().toUpperCase() : form.currencySel
    const name = form.name.trim()
    const country = form.country.trim()
    const taxRegime = form.taxRegime.trim() || '—'
    if (!name || !country || !currency) return

    if (editingId) {
      setList((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, name, country, currency, taxRegime } : e)),
      )
      logChange(`Entity updated — ${name} (${currency}) · ${country}`)
      setBanner(`Changes to ${name} saved.`)
    } else {
      let id = `ent-${slugify(name)}`
      while (list.some((e) => e.id === id)) id = `${id}-2`
      setList((prev) => [...prev, { id, name, country, currency, taxRegime, active: true }])
      logChange(`Entity added — ${name} (${currency}) · ${country} — active`)
      setBanner(`${name} added to the entity register.`)
    }
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(false)
  }

  const kpis = [
    { label: 'Active entities', value: String(activeCount), sub: `${list.length} on register`, icon: Building2 },
    { label: 'Countries covered', value: String(countries), sub: 'Active entities', icon: Globe2 },
    { label: 'Most suppliers', value: String(topEntity.count), sub: topEntity.name, icon: Users },
    { label: 'Group YTD spend', value: fmtGBP(groupYtdGBP), sub: 'All entities · GBP', icon: Landmark },
  ]

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-ink">Entity management</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <ShieldCheck size={13} aria-hidden="true" /> Entity changes are audit-logged
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={14} aria-hidden="true" /> Add entity
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 text-ink-faint">
              <k.icon size={15} aria-hidden="true" />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <p className="tabular mt-2 font-mono text-xl font-semibold text-ink">{k.value}</p>
            <p className="mt-0.5 truncate text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Success banner */}
      {banner && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent">
          <CheckCircle2 size={15} aria-hidden="true" />
          {banner}
        </div>
      )}

      {/* Add / edit form */}
      {showForm && (
        <Card>
          <CardHeader
            title={editingId ? 'Edit entity' : 'Add entity'}
            subtitle={
              editingId
                ? 'Changes apply immediately and are written to the audit trail'
                : 'New entities start active and are written to the audit trail'
            }
          />
          <form onSubmit={handleSubmit} className="space-y-4 p-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ent-name" className="mb-1 block text-xs font-medium text-ink-soft">
                  Legal name
                </label>
                <input
                  id="ent-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="NCons France SAS"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="ent-country" className="mb-1 block text-xs font-medium text-ink-soft">
                  Country
                </label>
                <input
                  id="ent-country"
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="France"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="ent-currency" className="mb-1 block text-xs font-medium text-ink-soft">
                  Functional currency
                </label>
                <select
                  id="ent-currency"
                  value={form.currencySel}
                  onChange={(e) => setForm({ ...form, currencySel: e.target.value })}
                  className={inputCls}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={OTHER}>Other (enter code)</option>
                </select>
                <p className="mt-1 text-[11px] text-ink-faint">
                  Transaction currencies are unlimited — invoices convert to this for the entity
                  books.
                </p>
              </div>
              {form.currencySel === OTHER && (
                <div>
                  <label
                    htmlFor="ent-currency-custom"
                    className="mb-1 block text-xs font-medium text-ink-soft"
                  >
                    Currency code
                  </label>
                  <input
                    id="ent-currency-custom"
                    required
                    maxLength={3}
                    value={form.customCurrency}
                    onChange={(e) => setForm({ ...form, customCurrency: e.target.value })}
                    placeholder="JPY"
                    className={cls(inputCls, 'font-mono uppercase')}
                  />
                </div>
              )}
              <div className={form.currencySel === OTHER ? 'sm:col-span-2' : ''}>
                <label htmlFor="ent-tax" className="mb-1 block text-xs font-medium text-ink-soft">
                  Tax regime notes
                </label>
                <input
                  id="ent-tax"
                  value={form.taxRegime}
                  onChange={(e) => setForm({ ...form, taxRegime: e.target.value })}
                  placeholder="VAT · withholding rules, off-payroll notes"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button>{editingId ? 'Save changes' : 'Add entity'}</Button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setForm(emptyForm)
                }}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:bg-canvas"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Entity register */}
      <Card>
        <CardHeader
          title="Entity register"
          subtitle={
            entity === 'all'
              ? 'Click a row to edit · toggle controls invoice intake for the entity'
              : 'Filtered to the selected entity — switch to All entities to manage the full register'
          }
        />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-medium text-ink-faint uppercase">
                <th className="py-2 pr-4 font-medium">Entity</th>
                <th className="py-2 pr-4 font-medium">Country</th>
                <th className="py-2 pr-4 font-medium">Functional currency</th>
                <th className="py-2 pr-4 font-medium">Tax regime</th>
                <th className="py-2 pr-4 text-right font-medium">Suppliers</th>
                <th className="py-2 pr-4 text-right font-medium">Open AP</th>
                <th className="py-2 font-medium">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => {
                const ap = openAP(e.id, e.currency)
                return (
                  <tr
                    key={e.id}
                    onClick={() => openEdit(e)}
                    className="group cursor-pointer transition-colors duration-200 hover:bg-canvas"
                  >
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        {e.name}
                        <Pencil
                          size={13}
                          aria-hidden="true"
                          className="text-ink-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        />
                      </span>
                      <span className="font-mono text-[11px] text-ink-faint">{e.id}</span>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">{e.country}</td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-ink-soft">{e.currency}</span>
                      {txnCurrencies(e.id).length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {txnCurrencies(e.id).map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center rounded-full border border-line px-1.5 py-px font-mono text-[10px] text-ink-faint"
                            >
                              {c}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="max-w-52 truncate py-3 pr-4 text-ink-soft" title={e.taxRegime}>
                      {e.taxRegime}
                    </td>
                    <td className="tabular py-3 pr-4 text-right font-mono text-ink">
                      {supplierCount(e.id)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="tabular block font-mono font-semibold text-ink">
                        {fmtMoney(ap, e.currency)}
                      </span>
                      <span className="tabular text-[11px] text-ink-faint">
                        ≈ {fmtGBP(toGBP(ap, e.currency))}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={e.active}
                        aria-label={`${e.active ? 'Deactivate' : 'Activate'} ${e.name}`}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          toggleActive(e.id)
                        }}
                        className={cls(
                          'relative h-5 w-9 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                          e.active ? 'bg-accent' : 'bg-line',
                        )}
                      >
                        <span
                          className={cls(
                            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200',
                            e.active && 'translate-x-4',
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-ink-faint">
                    No entities match the current entity filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent changes (session audit feed) */}
      <Card>
        <CardHeader
          title="Recent changes"
          subtitle="This session — entries are appended to the group audit trail"
        />
        <ul className="divide-y divide-line px-5 pb-3">
          {changes.map((c) => (
            <li key={c.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 rounded-lg bg-canvas p-2 text-ink-faint">
                <History size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink">{c.action}</p>
                <p className="text-[11px] text-ink-faint">
                  {c.ts} · {c.actor}
                </p>
              </div>
            </li>
          ))}
          {changes.length === 0 && (
            <li className="py-4 text-center text-sm text-ink-faint">
              No entity changes this session.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
