import { Download, FileSpreadsheet } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, Button } from '../components/ui'
import { invoices, suppliers, supplierById } from '../data'
import { fmtMoney, fmtCompact, agingBucket, daysOverdue } from '../utils'

const open = invoices.filter((i) => i.status !== 'paid' && i.status !== 'rejected')

// AP aging by supplier (detail table)
const agingBySupplier = suppliers
  .map((s) => {
    const invs = open.filter((i) => i.supplierId === s.id)
    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    for (const i of invs) buckets[agingBucket(i.dueDate)] += i.amount
    const total = invs.reduce((sum, i) => sum + i.amount, 0)
    return { name: s.name, ...buckets, total }
  })
  .filter((r) => r.total > 0)
  .sort((a, b) => b.total - a.total)

const agingTotals = agingBySupplier.reduce(
  (acc, r) => ({
    current: acc.current + r.current,
    '1-30': acc['1-30'] + r['1-30'],
    '31-60': acc['31-60'] + r['31-60'],
    '61-90': acc['61-90'] + r['61-90'],
    '90+': acc['90+'] + r['90+'],
    total: acc.total + r.total,
  }),
  { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 },
)

// Spend by category
const spendByCategory = Object.entries(
  suppliers.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + s.ytdSpend
    return acc
  }, {}),
)
  .map(([category, spend]) => ({ category, spend }))
  .sort((a, b) => b.spend - a.spend)

// Accrual: received, approved or in-process, unpaid at period end
const accrual = open.filter((i) => i.receivedDate <= '2026-05-31')
const accrualTotal = accrual.reduce((s, i) => s + i.amount, 0)

export function Reports() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Period: <span className="font-medium text-ink">June 2026 (open)</span> · figures live from AP subledger
        </p>
        <div className="flex gap-2">
          <Button variant="secondary">
            <FileSpreadsheet size={14} aria-hidden="true" /> Export XLSX
          </Button>
          <Button variant="secondary">
            <Download size={14} aria-hidden="true" /> Export CSV
          </Button>
        </div>
      </div>

      {/* AP Aging report */}
      <Card className="overflow-hidden">
        <CardHeader title="AP aging summary" subtitle="Open payables by supplier and days past due — as of Jun 11, 2026" />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                <th className="py-2.5 pr-3">Supplier</th>
                <th className="px-3 py-2.5 text-right">Current</th>
                <th className="px-3 py-2.5 text-right">1–30</th>
                <th className="px-3 py-2.5 text-right">31–60</th>
                <th className="px-3 py-2.5 text-right">61–90</th>
                <th className="px-3 py-2.5 text-right">90+</th>
                <th className="py-2.5 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {agingBySupplier.map((r) => (
                <tr key={r.name} className="hover:bg-canvas">
                  <td className="max-w-52 truncate py-2.5 pr-3 font-medium text-ink">{r.name}</td>
                  {(['current', '1-30', '31-60', '61-90', '90+'] as const).map((b) => (
                    <td key={b} className="tabular px-3 py-2.5 text-right font-mono text-[13px] text-ink-soft">
                      {r[b] ? fmtMoney(r[b]) : '—'}
                    </td>
                  ))}
                  <td className="tabular py-2.5 pl-3 text-right font-mono text-[13px] font-semibold text-ink">
                    {fmtMoney(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line">
                <td className="py-2.5 pr-3 text-[13px] font-semibold text-ink">Total</td>
                {(['current', '1-30', '31-60', '61-90', '90+'] as const).map((b) => (
                  <td key={b} className="tabular px-3 py-2.5 text-right font-mono text-[13px] font-semibold text-ink">
                    {agingTotals[b] ? fmtMoney(agingTotals[b]) : '—'}
                  </td>
                ))}
                <td className="tabular py-2.5 pl-3 text-right font-mono text-[13px] font-bold text-ink">
                  {fmtMoney(agingTotals.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Spend by category */}
        <Card>
          <CardHeader title="YTD spend by category" subtitle="All suppliers, Jan–Jun 2026" />
          <div className="h-72 p-4" role="img" aria-label="Horizontal bar chart of year-to-date spend by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCategory} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => fmtCompact(v)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [fmtMoney(Number(v)), 'YTD spend']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 12 }}
                />
                <Bar dataKey="spend" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Accrual report */}
        <Card>
          <CardHeader
            title="Month-end accrual"
            subtitle="Invoices received by May 31, unpaid — feeds the AP accrual journal entry"
          />
          <div className="px-5 pb-4">
            <div className="mb-3 rounded-lg bg-canvas px-4 py-3">
              <p className="text-xs text-ink-faint">Suggested accrual (Dr Expense / Cr Accrued AP)</p>
              <p className="tabular mt-0.5 font-mono text-xl font-semibold text-ink">{fmtMoney(accrualTotal)}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="py-2 pl-3 text-right">Days held</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accrual.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 pr-3 font-mono text-[13px] text-ink">{i.number}</td>
                    <td className="max-w-44 truncate px-3 py-2 text-[13px] text-ink-soft">
                      {supplierById(i.supplierId).name}
                    </td>
                    <td className="tabular px-3 py-2 text-right font-mono text-[13px] text-ink">
                      {fmtMoney(i.amount)}
                    </td>
                    <td className="tabular py-2 pl-3 text-right font-mono text-[13px] text-ink-soft">
                      {Math.max(0, daysOverdue(i.receivedDate))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* KPI definitions */}
      <Card>
        <CardHeader title="Metric definitions" subtitle="How these figures are computed" />
        <div className="grid gap-3 p-5 pt-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: 'DPO', d: '(Avg AP balance ÷ COGS) × days in period. Higher = longer to pay.' },
            { k: 'Touchless rate', d: 'Invoices posted with zero human edits ÷ total processed.' },
            { k: 'Discount capture', d: 'Discounts taken ÷ discounts offered, by value.' },
            { k: 'Exception rate', d: 'Invoices failing 3-way match or anomaly checks ÷ total.' },
          ].map((m) => (
            <div key={m.k} className="rounded-lg border border-line bg-canvas p-3.5">
              <p className="text-[13px] font-semibold text-ink">{m.k}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{m.d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
