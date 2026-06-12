import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from './lib/auth'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Copilot } from './components/Copilot'
import { NotificationsPanel } from './components/NotificationsPanel'
import { EntityProvider } from './context'
import type { Page, Invoice } from './types'

// Route-level code splitting — heavy dependencies (recharts on Dashboard and
// Reports, supabase on the data-backed pages) load with their page, not in
// the initial bundle.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Invoices = lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })))
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail').then((m) => ({ default: m.InvoiceDetail })))
const Capture = lazy(() => import('./pages/Capture').then((m) => ({ default: m.Capture })))
const SubmitInvoice = lazy(() => import('./pages/SubmitInvoice').then((m) => ({ default: m.SubmitInvoice })))
const POs = lazy(() => import('./pages/POs').then((m) => ({ default: m.POs })))
const Approvals = lazy(() => import('./pages/Approvals').then((m) => ({ default: m.Approvals })))
const Payments = lazy(() => import('./pages/Payments').then((m) => ({ default: m.Payments })))
const Suppliers = lazy(() => import('./pages/Suppliers').then((m) => ({ default: m.Suppliers })))
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })))
const Timesheets = lazy(() => import('./pages/Timesheets').then((m) => ({ default: m.Timesheets })))
const Statements = lazy(() => import('./pages/Statements').then((m) => ({ default: m.Statements })))
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })))
const ClientPOs = lazy(() => import('./pages/ClientPOs').then((m) => ({ default: m.ClientPOs })))
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })))
const Contracts = lazy(() => import('./pages/Contracts').then((m) => ({ default: m.Contracts })))
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })))
const Assurance = lazy(() => import('./pages/Assurance').then((m) => ({ default: m.Assurance })))
const Compliance = lazy(() => import('./pages/Compliance').then((m) => ({ default: m.Compliance })))
const Entities = lazy(() => import('./pages/Entities').then((m) => ({ default: m.Entities })))
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-6" aria-label="Loading page" role="status">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-line bg-surface" />
      <div className="h-40 rounded-xl border border-line bg-surface" />
    </div>
  )
}

const titles: Record<Page, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  capture: 'Invoice capture',
  submit: 'Submit invoice',
  timesheets: 'Timesheets',
  statements: 'Supplier statements',
  onboarding: 'Supplier onboarding',
  pos: 'Purchase orders',
  approvals: 'Approvals',
  payments: 'Payments',
  suppliers: 'Suppliers',
  clientpos: 'Client purchase orders',
  budgets: 'Budgets',
  contracts: 'Contracts',
  users: 'Users & roles',
  assurance: 'Month-end assurance',
  compliance: 'IR35 & compliance',
  entities: 'Entities',
  admin: 'Admin console',
  reports: 'Reports',
}

const SUPPLIER_PAGES: Page[] = ['submit', 'timesheets', 'statements']

function LoginScreen() {
  const { signInWithEmail, enterDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError(null)
    const res = await signInWithEmail(email.trim())
    setBusy(false)
    if (res.ok) setSent(true)
    else setError(res.error ?? 'Could not send the sign-in link')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <img src="/ncons-logo.png" alt="NCONS logo" className="h-14 w-14" width={56} height={56} />
      <h1 className="mt-4 text-xl font-bold tracking-[0.08em] text-ink">NCONS</h1>
      <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
        Supplier Portal
      </p>

      <div className="mt-8 w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        {sent ? (
          <div className="rounded-lg bg-accent-soft px-4 py-3 text-[13px] text-accent" role="status">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-0.5">
              The link signs you straight in. Links expire after a few minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs font-medium text-ink-soft">
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!email.trim() || busy}
              className="w-full cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] text-ink-faint">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <button
          onClick={enterDemo}
          className="w-full cursor-pointer rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          Explore the demo
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Demo mode — Sarah Chen, admin, sample data
        </p>
      </div>

      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-ink-faint">
        Suppliers and approvers each get their own magic-link login, scoped by row-level
        security — suppliers see only their own invoices, timesheets and statements.
      </p>
      <p className="mt-8 text-[10px] text-ink-faint">
        Build it. Support it. Scale it. <span className="italic">Powered by intelligence.</span>
      </p>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const auth = useAuth()

  // Suppliers only see their own pages.
  useEffect(() => {
    if (auth.role === 'supplier' && (!SUPPLIER_PAGES.includes(page) || invoice)) {
      setInvoice(null)
      setPage('submit')
    }
  }, [auth.role, page, invoice])

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <img
          src="/ncons-logo.png"
          alt="NCONS logo"
          className="h-12 w-12 animate-pulse"
          width={48}
          height={48}
        />
      </div>
    )
  }

  if (auth.status === 'signed_out') {
    return <LoginScreen />
  }

  const navigate = (p: Page) => {
    setInvoice(null)
    setPage(p)
  }

  const openInvoice = (inv: Invoice) => {
    setPage('invoices')
    setInvoice(inv)
  }

  return (
    <EntityProvider>
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        page={page}
        onNavigate={navigate}
        onOpenCopilot={() => setCopilotOpen(true)}
        onSignOut={() => void auth.signOut()}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={invoice ? 'Invoice detail' : titles[page]}
          page={invoice ? 'invoice-detail' : page}
          onNewInvoice={() => navigate('capture')}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageSkeleton />}>
          {invoice ? (
            <InvoiceDetail invoice={invoice} onBack={() => setInvoice(null)} />
          ) : page === 'dashboard' ? (
            <Dashboard onNavigate={navigate} />
          ) : page === 'invoices' ? (
            <Invoices onOpen={openInvoice} />
          ) : page === 'capture' ? (
            <Capture onOpen={openInvoice} />
          ) : page === 'submit' ? (
            <SubmitInvoice />
          ) : page === 'timesheets' ? (
            <Timesheets />
          ) : page === 'statements' ? (
            <Statements />
          ) : page === 'onboarding' ? (
            <Onboarding />
          ) : page === 'pos' ? (
            <POs />
          ) : page === 'approvals' ? (
            <Approvals onOpen={openInvoice} />
          ) : page === 'payments' ? (
            <Payments />
          ) : page === 'suppliers' ? (
            <Suppliers />
          ) : page === 'clientpos' ? (
            <ClientPOs />
          ) : page === 'budgets' ? (
            <Budgets />
          ) : page === 'contracts' ? (
            <Contracts />
          ) : page === 'users' ? (
            <Users />
          ) : page === 'assurance' ? (
            <Assurance />
          ) : page === 'compliance' ? (
            <Compliance />
          ) : page === 'entities' ? (
            <Entities />
          ) : page === 'admin' ? (
            <Admin />
          ) : (
            <Reports />
          )}
          </Suspense>
        </main>
      </div>
      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
    </EntityProvider>
  )
}
