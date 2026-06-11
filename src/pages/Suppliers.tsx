import { useState } from 'react'
import { Search, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react'
import { Card, RiskBadge, Button } from '../components/ui'
import { suppliers } from '../data'
import { fmtCompact, cls } from '../utils'

export function Suppliers() {
  const [q, setQ] = useState('')
  const rows = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.category.toLowerCase().includes(q.toLowerCase()),
  )

  const compliance = (s: (typeof suppliers)[number]) => {
    const issues: string[] = []
    if (s.taxFormStatus !== 'verified') issues.push(`W-9 ${s.taxFormStatus}`)
    if (!s.bankVerified) issues.push('bank unverified')
    return issues
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search suppliers…"
            aria-label="Search suppliers"
            className="w-72 rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
        </label>
        <Button>
          <UserPlus size={15} aria-hidden="true" /> Invite supplier
        </Button>
      </div>

      {/* Onboarding funnel */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active suppliers', value: '12', sub: '9 portal-enabled' },
          { label: 'Onboarding', value: '2', sub: 'Cobalt, Ironpeak pending docs' },
          { label: 'Compliance gaps', value: '3', sub: 'W-9 or bank verification' },
          { label: 'YTD spend', value: fmtCompact(suppliers.reduce((s, x) => s + x.ytdSpend, 0)), sub: 'across all suppliers' },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs font-medium text-ink-soft">{k.label}</p>
            <p className="tabular mt-1.5 font-mono text-xl font-semibold text-ink">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-3 py-3">Terms</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3">Compliance</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3 text-right">YTD spend</th>
                <th className="px-3 py-3 text-right">Open balance</th>
                <th className="px-3 py-3 text-right">Avg pay days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((s) => {
                const issues = compliance(s)
                return (
                  <tr key={s.id} className="transition-colors hover:bg-canvas">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-[11px] font-bold text-primary">
                          {s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{s.name}</p>
                          <p className="text-[11px] text-ink-faint">
                            {s.category} · {s.country}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-soft">
                      {s.paymentTerms}
                      {s.discountTerms && (
                        <span className="block text-[11px] text-accent">{s.discountTerms}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{s.paymentMethod}</td>
                    <td className="px-3 py-3">
                      {issues.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                          <CheckCircle2 size={13} aria-hidden="true" /> Complete
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-warn">
                          {s.taxFormStatus === 'missing' || !s.bankVerified ? (
                            <XCircle size={13} aria-hidden="true" />
                          ) : (
                            <Clock size={13} aria-hidden="true" />
                          )}
                          {issues.join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge level={s.riskLevel} />
                    </td>
                    <td className="tabular px-3 py-3 text-right font-mono font-medium text-ink">
                      {fmtCompact(s.ytdSpend)}
                    </td>
                    <td className="tabular px-3 py-3 text-right font-mono text-ink-soft">
                      {fmtCompact(s.openBalance)}
                    </td>
                    <td className={cls('tabular px-3 py-3 text-right font-mono', s.avgPayDays > 40 ? 'text-warn' : 'text-ink-soft')}>
                      {s.avgPayDays || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
