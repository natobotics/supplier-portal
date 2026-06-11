import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import type { InvoiceStatus, MatchStatus, RiskLevel } from '../types'
import { cls } from '../utils'

// CSS-only tooltip: bubble shows on hover or keyboard focus within the trigger.
// Absolute + pointer-events-none so it never affects layout or intercepts clicks.
export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-left text-[11px] whitespace-normal text-surface opacity-0 shadow-sm transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

// Small help icon with a tooltip — focusable so keyboard users can reveal it.
export function Hint({ text }: { text: string }) {
  return (
    <Tip label={text}>
      <button
        type="button"
        tabIndex={0}
        aria-label={text}
        className="inline-flex cursor-help items-center text-ink-faint transition-colors duration-150 hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <HelpCircle size={13} aria-hidden="true" />
      </button>
    </Tip>
  )
}

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
  title: ReactNode
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

const statusHints: Record<InvoiceStatus, string> = {
  captured: 'AI has read the invoice — entering the review queue',
  review: 'Low-confidence fields need a human check before approval',
  exception: 'Failed a control — duplicate, rate, fraud or PO check',
  approval: 'Moving through the fixed 4-step approval chain',
  scheduled: 'Approved — waiting in a payment run',
  paid: 'Settled — remittance advice available to the supplier',
  rejected: 'Rejected and returned to the supplier with a reason',
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = statusStyles[status]
  return (
    <Tip label={statusHints[status]}>
      <span
        className={cls(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
          s.cls,
        )}
      >
        {s.label}
      </span>
    </Tip>
  )
}

const matchStyles: Record<MatchStatus, { label: string; cls: string }> = {
  matched: { label: '3-way matched', cls: 'text-accent' },
  price_variance: { label: 'Price variance', cls: 'text-danger' },
  qty_variance: { label: 'Qty variance', cls: 'text-warn' },
  no_po: { label: 'Non-PO', cls: 'text-ink-faint' },
  pending: { label: 'Match pending', cls: 'text-secondary' },
}

const matchHints: Record<MatchStatus, string> = {
  matched: 'Invoice agrees with the PO and timesheet/receipt',
  price_variance: 'Billed price differs from the PO rate',
  qty_variance: 'Billed quantity exceeds what was received/approved',
  no_po: 'No purchase order reference — needs manual cost approval',
  pending: 'Match check still running',
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  const m = matchStyles[status]
  return (
    <Tip label={matchHints[status]}>
      <span className={cls('text-xs font-medium whitespace-nowrap', m.cls)}>{m.label}</span>
    </Tip>
  )
}

const riskHint = 'Supplier risk from compliance status, bank verification and billing history'

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map = {
    low: 'bg-accent-soft text-accent',
    medium: 'bg-warn-soft text-warn',
    high: 'bg-danger-soft text-danger',
  }
  return (
    <Tip label={riskHint}>
      <span
        className={cls(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
          map[level],
        )}
      >
        {level}
      </span>
    </Tip>
  )
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.9 ? 'bg-accent' : value >= 0.75 ? 'bg-warn' : 'bg-danger'
  return (
    <Tip label="AI extraction confidence — fields below 90% are routed to human review">
      <span className="inline-flex items-center gap-2">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
          <span className={cls('block h-full rounded-full', color)} style={{ width: `${pct}%` }} />
        </span>
        <span className="tabular text-xs text-ink-soft">{pct}%</span>
      </span>
    </Tip>
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
