import type { ReactNode } from 'react'
import type { InvoiceStatus, MatchStatus, RiskLevel } from '../types'
import { cls } from '../utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cls('rounded-xl border border-line bg-surface', className)}>{children}</div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between px-5 pt-4 pb-1">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const statusStyles: Record<InvoiceStatus, { label: string; cls: string }> = {
  captured: { label: 'Captured', cls: 'bg-info-soft text-secondary' },
  review: { label: 'Needs review', cls: 'bg-warn-soft text-warn' },
  exception: { label: 'Exception', cls: 'bg-danger-soft text-danger' },
  approval: { label: 'In approval', cls: 'bg-[#ede9fe] text-[#6d28d9]' },
  scheduled: { label: 'Scheduled', cls: 'bg-info-soft text-secondary' },
  paid: { label: 'Paid', cls: 'bg-accent-soft text-accent' },
  rejected: { label: 'Rejected', cls: 'bg-danger-soft text-danger' },
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = statusStyles[status]
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        s.cls,
      )}
    >
      {s.label}
    </span>
  )
}

const matchStyles: Record<MatchStatus, { label: string; cls: string }> = {
  matched: { label: '3-way matched', cls: 'text-accent' },
  price_variance: { label: 'Price variance', cls: 'text-danger' },
  qty_variance: { label: 'Qty variance', cls: 'text-warn' },
  no_po: { label: 'Non-PO', cls: 'text-ink-faint' },
  pending: { label: 'Match pending', cls: 'text-secondary' },
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  const m = matchStyles[status]
  return <span className={cls('text-xs font-medium whitespace-nowrap', m.cls)}>{m.label}</span>
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map = {
    low: 'bg-accent-soft text-accent',
    medium: 'bg-warn-soft text-warn',
    high: 'bg-danger-soft text-danger',
  }
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
        map[level],
      )}
    >
      {level}
    </span>
  )
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.9 ? 'bg-accent' : value >= 0.75 ? 'bg-warn' : 'bg-danger'
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
        <span className={cls('block h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular text-xs text-ink-soft">{pct}%</span>
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  className,
  disabled,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
    ghost: 'text-ink-soft hover:bg-canvas hover:text-ink',
    danger: 'bg-danger text-white hover:bg-[#b91c1c]',
  }
  return (
    <button className={cls(base, variants[variant], className)} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
