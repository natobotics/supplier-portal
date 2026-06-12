import {
  LayoutDashboard,
  FileText,
  Inbox,
  Send,
  ClipboardList,
  CheckSquare,
  CreditCard,
  Building2,
  BarChart3,
  Sparkles,
  Briefcase,
  ClipboardCheck,
  ShieldCheck,
  Globe,
  Settings,
  Clock3,
  ReceiptText,
  UserPlus,
  PiggyBank,
  FileSignature,
  Users,
  LogOut,
} from 'lucide-react'
import type { Page } from '../types'
import { invoices } from '../data'
import { cls } from '../utils'
import { useAuth, ROLE_PAGES } from '../lib/auth'

interface NavItem {
  id: Page
  label: string
  icon: typeof LayoutDashboard
}

const groups: Array<{ header?: string; items: NavItem[] }> = [
  {
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    header: 'Operations',
    items: [
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'capture', label: 'Capture', icon: Inbox },
      { id: 'pos', label: 'Purchase orders', icon: ClipboardList },
      { id: 'approvals', label: 'Approvals', icon: CheckSquare },
      { id: 'payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    header: 'Supplier portal',
    items: [
      { id: 'submit', label: 'Submit invoice', icon: Send },
      { id: 'timesheets', label: 'Timesheets', icon: Clock3 },
      { id: 'statements', label: 'Statements', icon: ReceiptText },
      { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
    ],
  },
  {
    header: 'Finance',
    items: [
      { id: 'clientpos', label: 'Client POs', icon: Briefcase },
      { id: 'budgets', label: 'Budgets', icon: PiggyBank },
      { id: 'assurance', label: 'Month-end', icon: ClipboardCheck },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    header: 'Administration',
    items: [
      { id: 'suppliers', label: 'Suppliers', icon: Building2 },
      { id: 'contracts', label: 'Contracts', icon: FileSignature },
      { id: 'compliance', label: 'IR35 & compliance', icon: ShieldCheck },
      { id: 'entities', label: 'Entities', icon: Globe },
      { id: 'users', label: 'Users & roles', icon: Users },
      { id: 'admin', label: 'Admin console', icon: Settings },
    ],
  },
]

export function Sidebar({
  page,
  onNavigate,
  onOpenCopilot,
  onSignOut,
}: {
  page: Page
  onNavigate: (p: Page) => void
  onOpenCopilot: () => void
  onSignOut: () => void
}) {
  const auth = useAuth()
  const pendingApprovals = invoices.filter((i) =>
    i.approvals.some((a) => a.status === 'pending'),
  ).length
  const exceptions = invoices.filter((i) => i.status === 'exception').length

  const badges: Partial<Record<Page, number>> = {
    approvals: pendingApprovals,
    invoices: exceptions,
  }

  // Each role sees only its own pages; groups with nothing left disappear.
  const allowed = ROLE_PAGES[auth.role]
  const visibleGroups: typeof groups = allowed
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((i) => allowed.includes(i.id)) }))
        .filter((g) => g.items.length > 0)
    : groups

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <img
          src="/ncons-logo.png"
          alt="NCONS logo"
          className="h-9 w-9 shrink-0"
          width={36}
          height={36}
        />
        <div>
          <span className="block text-[15px] leading-tight font-bold tracking-[0.08em] text-ink">
            NCONS
          </span>
          <span className="block text-[10px] leading-tight font-medium tracking-wide text-ink-faint uppercase">
            Supplier Portal
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="Primary">
        {visibleGroups.map((g, gi) => (
          <div key={gi} className="mb-1.5">
            {g.header && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">
                {g.header}
              </p>
            )}
            <div className="space-y-0.5">
              {g.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  aria-current={page === id ? 'page' : undefined}
                  className={cls(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary',
                    page === id
                      ? 'bg-primary/8 text-primary'
                      : 'text-ink-soft hover:bg-canvas hover:text-ink',
                  )}
                >
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
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
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        {auth.role !== 'supplier' && auth.role !== 'auditor' && (
          <button
            onClick={onOpenCopilot}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2.5 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Sparkles size={16} aria-hidden="true" />
            AP Copilot
          </button>
        )}
        <div className="mt-3 flex items-center gap-2.5 px-2 pb-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            {auth.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-xs font-medium text-ink">
              {auth.name}
              {auth.status === 'demo' && (
                <span className="rounded-full border border-line bg-canvas px-1.5 py-0.5 text-[9px] font-medium text-ink-faint">
                  Demo
                </span>
              )}
            </p>
            <p className="truncate text-[11px] text-ink-faint">
              {auth.status === 'authenticated' ? (auth.email ?? auth.title) : auth.title}
            </p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-danger"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 px-2 text-[10px] leading-snug text-ink-faint">
          Build it. Support it. Scale it.
          <span className="block italic">Powered by intelligence.</span>
        </p>
      </div>
    </aside>
  )
}
