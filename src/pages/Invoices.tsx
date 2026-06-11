import { useMemo, useState } from 'react'
import { AlertTriangle, Mail, Upload, Rss, Globe, ChevronRight, Filter } from 'lucide-react'
import { Card, StatusBadge, MatchBadge, Button } from '../components/ui'
import { invoices, supplierById, entityById } from '../data'
import { useEntity } from '../context'
import { fmtMoney, fmtDateShort, daysOverdue, cls } from '../utils'
import type { Invoice, InvoiceStatus } from '../types'

const tabs: Array<{ id: InvoiceStatus | 'all' | 'overdue' | 'credit_notes'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Needs review' },
  { id: 'exception', label: 'Exceptions' },
  { id: 'approval', label: 'In approval' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
  { id: 'credit_notes', label: 'Credit notes' },
]

const sourceIcon = {
  email: Mail,
  upload: Upload,
  edi: Rss,
  portal: Globe,
}

export function Invoices({ onOpen }: { onOpen: (inv: Invoice) => void }) {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { entity } = useEntity()

  const scoped = useMemo(
    () => (entity === 'all' ? invoices : invoices.filter((i) => i.entityId === entity)),
    [entity],
  )

  const rows = useMemo(() => {
    let list = scoped
    if (tab === 'credit_notes') list = list.filter((i) => i.docType === 'credit_note')
    else if (tab === 'overdue')
      list = list.filter(
        (i) => i.docType !== 'credit_note' && i.status !== 'paid' && daysOverdue(i.dueDate) > 0,
      )
    else if (tab !== 'all')
      list = list.filter((i) => i.docType !== 'credit_note' && i.status === tab)
    return [...list].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
  }, [tab, scoped])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const counts = useMemo(() => {
    const std = scoped.filter((i) => i.docType !== 'credit_note')
    const c: Record<string, number> = { all: scoped.length }
    for (const t of tabs) {
      if (t.id === 'all') continue
      c[t.id] =
        t.id === 'credit_notes'
          ? scoped.filter((i) => i.docType === 'credit_note').length
          : t.id === 'overdue'
            ? std.filter((i) => i.status !== 'paid' && daysOverdue(i.dueDate) > 0).length
            : std.filter((i) => i.status === t.id).length
    }
    return c
  }, [scoped])

  return (
    <div className="space-y-4 p-6">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cls(
                'cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
                tab === t.id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-canvas hover:text-ink',
              )}
            >
              {t.label}
              <span className={cls('ml-1.5 text-[11px]', tab === t.id ? 'text-white/70' : 'text-ink-faint')}>
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <Button variant="secondary" className="hidden lg:inline-flex">
          <Filter size={14} aria-hidden="true" /> Filters
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-info-soft px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button>Approve selected</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Supplier</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Match</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Due</th>
                <th className="px-3 py-3">Source</th>
                <th className="w-10 px-3 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((inv) => {
                const s = supplierById(inv.supplierId)
                const over = inv.status !== 'paid' && daysOverdue(inv.dueDate) > 0
                const SourceIcon = sourceIcon[inv.source]
                const entityShort = entityById(inv.entityId)?.name.replace(/^NCons /, '')
                return (
                  <tr
                    key={inv.id}
                    onClick={() => onOpen(inv)}
                    className="group cursor-pointer transition-colors hover:bg-canvas"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggle(inv.id)}
                        aria-label={`Select invoice ${inv.number}`}
                        className="h-4 w-4 cursor-pointer rounded border-line accent-[#1e3a5f]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] font-medium text-ink">{inv.number}</span>
                        {inv.docType === 'credit_note' && (
                          <span className="rounded-full bg-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                            CN
                          </span>
                        )}
                        {inv.anomalies.length > 0 && (
                          <AlertTriangle
                            size={13}
                            className={cls(
                              inv.anomalies.some((a) => a.severity === 'high')
                                ? 'text-danger'
                                : 'text-warn',
                            )}
                            aria-label={`${inv.anomalies.length} anomalies flagged`}
                          />
                        )}
                      </div>
                      {inv.poNumber && (
                        <span className="text-[11px] text-ink-faint">{inv.poNumber}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-44 truncate font-medium text-ink">{s.name}</p>
                      <p className="max-w-44 truncate text-[11px] text-ink-faint">
                        {entity === 'all' && entityShort ? `${entityShort} · ` : ''}
                        {s.category}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-3 py-3">
                      <MatchBadge status={inv.matchStatus} />
                    </td>
                    <td
                      className={cls(
                        'tabular px-3 py-3 text-right font-mono font-medium',
                        inv.amount < 0 ? 'text-danger' : 'text-ink',
                      )}
                    >
                      {fmtMoney(inv.amount, inv.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cls('text-[13px] whitespace-nowrap', over ? 'font-medium text-danger' : 'text-ink-soft')}>
                        {fmtDateShort(inv.dueDate)}
                        {over && ` · ${daysOverdue(inv.dueDate)}d late`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-ink-faint capitalize">
                        <SourceIcon size={13} aria-hidden="true" />
                        {inv.source}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-faint">
                      <ChevronRight
                        size={15}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            No invoices in this view.
          </p>
        )}
      </Card>
    </div>
  )
}
