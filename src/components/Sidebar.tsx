import {
  LayoutDashboard,
  FileText,
  Inbox,
  CheckSquare,
  CreditCard,
  Building2,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import type { Page } from '../types'
import { invoices } from '../data'
import { cls } from '../utils'

const nav: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'capture', label: 'Capture', icon: Inbox },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'suppliers', label: 'Suppliers', icon: Building2 },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

export function Sidebar({
  page,
  onNavigate,
  onOpenCopilot,
}: {
  page: Page
  onNavigate: (p: Page) => void
  onOpenCopilot: () => void
}) {
  const pendingApprovals = invoices.filter((i) =>
    i.approvals.some((a) => a.status === 'pending'),
  ).length
  const exceptions = invoices.filter((i) => i.status === 'exception').length

  const badges: Partial<Record<Page, number>> = {
    approvals: pendingApprovals,
    invoices: exceptions,
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
            <path d="M9 22 16 9l7 13h-4.2L16 16.4 13.2 22H9Z" fill="#fff" />
          </svg>
        </span>
        <div>
          <span className="block text-[15px] leading-tight font-bold tracking-tight text-ink">
            Aprio
          </span>
          <span className="block text-[10px] leading-tight font-medium tracking-wide text-ink-faint uppercase">
            Accounts Payable
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Primary">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={page === id ? 'page' : undefined}
            className={cls(
              'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary',
              page === id
                ? 'bg-primary/8 text-primary'
                : 'text-ink-soft hover:bg-canvas hover:text-ink',
            )}
          >
            <Icon size={17} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1 text-left">{label}</span>
            {badges[id] ? (
              <span
                className={cls(
                  'rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold',
                  id === 'invoices' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn',
                )}
              >
                {badges[id]}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={onOpenCopilot}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2.5 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Sparkles size={16} aria-hidden="true" />
          AP Copilot
        </button>
        <div className="mt-3 flex items-center gap-2.5 px-2 pb-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            SC
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink">Sarah Chen</p>
            <p className="truncate text-[11px] text-ink-faint">AP Manager</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
