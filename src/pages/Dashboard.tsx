import { useMemo } from 'react'
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Wallet,
  Percent,
  Zap,
  ArrowRight,
  Sparkles,
  Bot,
  User,
  Cog,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from 'recharts'
import { Card, CardHeader, Button } from '../components/ui'
import { invoices, activities, cashForecast, monthlyTrend, supplierById, entityById } from '../data'
import {
  fmtMoney,
  fmtCompact,
  fmtGBP,
  toGBP,
  convert,
  REPORTING_CURRENCY,
  agingBucket,
  daysOverdue,
  cls,
} from '../utils'
import { useEntity } from '../context'
import type { Page, Invoice } from '../types'

const touchlessData = monthlyTrend.map((m) => ({
  ...m,
  rate: Math.round((m.touchless / m.processed) * 100),
}))

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub: string
  icon: typeof Wallet
  trend?: 'up' | 'down'
  tone?: 'neutral' | 'danger' | 'accent'
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <Icon
          size={16}
          className={cls(
            tone === 'danger' ? 'text-danger' : tone === 'accent' ? 'text-accent' : 'text-ink-faint',
          )}
          aria-hidden="true"
        />
      </div>
      <p className="tabular mt-2 font-mono text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
        {trend === 'up' && <TrendingUp size={12} className="text-danger" aria-hidden="true" />}
        {trend === 'down' && <TrendingDown size={12} className="text-accent" aria-hidden="true" />}
        {sub}
      </p>
    </Card>
  )
}

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { entity } = useEntity()
  const currency = entity === 'all' ? REPORTING_CURRENCY : entityById(entity)?.currency ?? REPORTING_CURRENCY

  // Entity functional currency for a single entity; consolidated GBP for the group view.
  const money = (n: number) => (entity === 'all' ? fmtGBP(n) : fmtMoney(n, currency))
  const compact = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)

  const {
    open,
    outstanding,
    overdue,
    overdueAmt,
    pendingApproval,
    pendingAmt,
    discountAvailable,
    agingData,
    topBalances,
  } = useMemo(() => {
    const scoped = entity === 'all' ? invoices : invoices.filter((i) => i.entityId === entity)
    // Credit notes carry negative amounts, so every sum below nets them in.
    // Invoices are in document currency — convert to GBP for the group view,
    // or to the entity's functional currency for the entity view, before summing.
    const conv = (i: Invoice) =>
      entity === 'all' ? toGBP(i.amount, i.currency) : convert(i.amount, i.currency, currency)

    const open = scoped.filter((i) => i.status !== 'paid' && i.status !== 'rejected')
    const outstanding = open.reduce((s, i) => s + conv(i), 0)
    const overdue = open.filter((i) => daysOverdue(i.dueDate) > 0)
    const overdueAmt = overdue.reduce((s, i) => s + conv(i), 0)
    const pendingApproval = scoped.filter((i) => i.approvals.some((a) => a.status === 'pending'))
    const pendingAmt = pendingApproval.reduce((s, i) => s + conv(i), 0)
    const discountAvailable = open
      .filter((i) => i.discount && daysOverdue(i.discount.deadline) <= 0)
      .reduce(
        (s, i) =>
          s +
          (entity === 'all'
            ? toGBP(i.discount?.amount ?? 0, i.currency)
            : convert(i.discount?.amount ?? 0, i.currency, currency)),
        0,
      )

    const agingData = (['current', '1-30', '31-60', '61-90', '90+'] as const).map((bucket) => ({
      bucket: bucket === 'current' ? 'Current' : bucket === '90+' ? '90+ days' : `${bucket} days`,
      amount: open
        .filter((i) => agingBucket(i.dueDate) === bucket)
        .reduce((s, i) => s + conv(i), 0),
    }))

    const topBalances = open
      .reduce<Array<{ id: string; total: number }>>((acc, i) => {
        const e = acc.find((x) => x.id === i.supplierId)
        if (e) e.total += conv(i)
        else acc.push({ id: i.supplierId, total: conv(i) })
        return acc
      }, [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)

    return {
      open,
      outstanding,
      overdue,
      overdueAmt,
      pendingApproval,
      pendingAmt,
      discountAvailable,
      agingData,
      topBalances,
    }
  }, [entity, currency])

  const insights = [
    {
      icon: AlertTriangle,
      tone: 'danger' as const,
      title: '2 high-risk anomalies need attention',
      body: 'Probable duplicate from Tom Becker — TB-0590 ($11,400) mirrors TB-0589, paid Jun 2 — and a bank-account change on Stellar IT Hardware before the $23,150 SIH-5521 payment.',
      cta: 'Review exceptions',
      page: 'invoices' as Page,
    },
    {
      icon: Percent,
      tone: 'accent' as const,
      title: `${money(discountAvailable)} in early-pay discounts expire today`,
      body: 'TBR-2088 (TalentBridge, save $588) and SNM-2026-06 (SecureNet, save $168) both hit their 2/10 deadline today, Jun 11. Release payment today to capture both.',
      cta: 'Open payments',
      page: 'payments' as Page,
    },
    {
      icon: Clock,
      tone: 'warn' as const,
      title: 'Rate violation on RP-2026-013',
      body: 'Rajan Pillai billed $104.74/hr against the $95.00/hr rate on PO-2026-0007 (+10.3%). Supplier cites out-of-hours work — the PO carries no uplift clause.',
      cta: 'View approvals',
      page: 'approvals' as Page,
    },
  ]

  return (
    <div className="space-y-5 p-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi
          label="Outstanding AP"
          value={compact(outstanding)}
          sub={`${open.length} open invoices · net of credit notes`}
          icon={Wallet}
        />
        <Kpi
          label="Overdue"
          value={compact(overdueAmt)}
          sub={`${overdue.length} invoices past due`}
          icon={AlertTriangle}
          tone="danger"
          trend="up"
        />
        <Kpi
          label="Pending approval"
          value={compact(pendingAmt)}
          sub={`${pendingApproval.length} awaiting action`}
          icon={Clock}
        />
        <Kpi
          label="DPO"
          value="28.4 days"
          sub="vs 31.2 last quarter"
          icon={TrendingDown}
          trend="down"
          tone="accent"
        />
        <Kpi
          label="Touchless rate"
          value="77%"
          sub="May: 60 of 78 invoices"
          icon={Zap}
          tone="accent"
          trend="down"
        />
      </div>

      {/* AI insights */}
      <Card>
        <CardHeader
          title="AI insights"
          subtitle="Generated from live AP data — refreshed 8 minutes ago"
          action={
            <span className="flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-medium text-secondary">
              <Sparkles size={11} aria-hidden="true" /> Aprio AI
            </span>
          }
        />
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {insights.map((ins) => (
            <div
              key={ins.title}
              className="flex flex-col rounded-lg border border-line bg-canvas p-4"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cls(
                    'mt-0.5 rounded-md p-1.5',
                    ins.tone === 'danger' && 'bg-danger-soft text-danger',
                    ins.tone === 'accent' && 'bg-accent-soft text-accent',
                    ins.tone === 'warn' && 'bg-warn-soft text-warn',
                  )}
                >
                  <ins.icon size={14} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[13px] leading-snug font-semibold text-ink">{ins.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{ins.body}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate(ins.page)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 self-start text-xs font-medium text-secondary transition-colors hover:text-primary"
              >
                {ins.cta} <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="AP aging"
            subtitle={
              entity === 'all'
                ? 'Open balance by days past due — consolidated GBP'
                : 'Open balance by days past due'
            }
          />
          <div className="h-64 p-4" role="img" aria-label="Bar chart of accounts payable aging buckets">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => compact(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(v) => [money(Number(v)), 'Open balance']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 12 }}
                />
                <Bar dataKey="amount" fill="#1e3a5f" radius={[5, 5, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cash-out forecast" subtitle="Scheduled vs projected payments, next 6 weeks" />
          <div className="h-64 p-4" role="img" aria-label="Combined chart of scheduled and projected cash outflow over the next six weeks">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashForecast} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => fmtCompact(v)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(v, name) => [
                    fmtMoney(Number(v)),
                    name === 'scheduled' ? 'Scheduled' : 'Projected',
                  ]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="scheduled" name="Scheduled" fill="#1e3a5f" radius={[5, 5, 0, 0]} maxBarSize={40} />
                <Line
                  dataKey="projected"
                  name="Projected"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Touchless trend */}
        <Card className="xl:col-span-1">
          <CardHeader title="Touchless processing" subtitle="Invoices fully automated by AI, by month" />
          <div className="h-56 p-4" role="img" aria-label="Chart of touchless invoice processing rate by month">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={touchlessData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="rate"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v, name) => (name === 'rate' ? [`${v}%`, 'Touchless rate'] : [v, name])}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 12 }}
                />
                <Line
                  yAxisId="rate"
                  dataKey="rate"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#059669' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity feed */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Activity"
            subtitle="AI actions, approvals and payment events"
            action={
              <Button variant="ghost" onClick={() => onNavigate('invoices')} className="text-xs">
                View all
              </Button>
            }
          />
          <ul className="divide-y divide-line px-5 pb-3">
            {activities.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <span
                  className={cls(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    a.kind === 'ai' && 'bg-info-soft text-secondary',
                    a.kind === 'user' && 'bg-accent-soft text-accent',
                    a.kind === 'system' && 'bg-canvas text-ink-faint',
                  )}
                >
                  {a.kind === 'ai' ? (
                    <Bot size={13} aria-hidden="true" />
                  ) : a.kind === 'user' ? (
                    <User size={13} aria-hidden="true" />
                  ) : (
                    <Cog size={13} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">
                    <span className="font-medium">{a.actor}</span>{' '}
                    <span className="text-ink-soft">{a.action}</span>
                  </p>
                  <p className="truncate text-xs text-ink-faint">{a.target}</p>
                </div>
                <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-faint">{a.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top suppliers strip */}
      <Card>
        <CardHeader title="Largest open balances" subtitle="By supplier" />
        <div className="grid gap-3 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {topBalances.map(({ id, total }) => {
            const s = supplierById(id)
            return (
              <button
                key={id}
                onClick={() => onNavigate('suppliers')}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-canvas px-4 py-3 text-left transition-colors hover:border-primary/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{s.name}</p>
                  <p className="text-[11px] text-ink-faint">{s.category}</p>
                </div>
                <span className="tabular ml-3 font-mono text-sm font-semibold text-ink">
                  {compact(total)}
                </span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
