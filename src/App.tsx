import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Copilot } from './components/Copilot'
import { NotificationsPanel } from './components/NotificationsPanel'
import { Dashboard } from './pages/Dashboard'
import { Invoices } from './pages/Invoices'
import { InvoiceDetail } from './pages/InvoiceDetail'
import { Capture } from './pages/Capture'
import { SubmitInvoice } from './pages/SubmitInvoice'
import { POs } from './pages/POs'
import { Approvals } from './pages/Approvals'
import { Payments } from './pages/Payments'
import { Suppliers } from './pages/Suppliers'
import { Reports } from './pages/Reports'
import { Timesheets } from './pages/Timesheets'
import { Statements } from './pages/Statements'
import { Onboarding } from './pages/Onboarding'
import { ClientPOs } from './pages/ClientPOs'
import { Budgets } from './pages/Budgets'
import { Contracts } from './pages/Contracts'
import { Users } from './pages/Users'
import { Assurance } from './pages/Assurance'
import { Compliance } from './pages/Compliance'
import { Entities } from './pages/Entities'
import { Admin } from './pages/Admin'
import { EntityProvider } from './context'
import type { Page, Invoice } from './types'

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

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [signedOut, setSignedOut] = useState(false)

  if (signedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
        <img src="/ncons-logo.png" alt="NCONS logo" className="h-14 w-14" width={56} height={56} />
        <h1 className="mt-4 text-xl font-bold tracking-[0.08em] text-ink">NCONS</h1>
        <p className="text-[11px] font-medium tracking-wide text-ink-faint uppercase">
          Supplier Portal
        </p>
        <p className="mt-6 text-sm text-ink-soft">You have been signed out.</p>
        <button
          onClick={() => setSignedOut(false)}
          className="mt-4 cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Sign back in as Sarah Chen
        </button>
        <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-ink-faint">
          Production: Supabase Auth magic links — every supplier and approver gets their own
          scoped login, enforced by row-level security.
        </p>
        <p className="mt-10 text-[10px] text-ink-faint">
          Build it. Support it. Scale it. <span className="italic">Powered by intelligence.</span>
        </p>
      </div>
    )
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
        onSignOut={() => setSignedOut(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={invoice ? 'Invoice detail' : titles[page]}
          page={invoice ? 'invoice-detail' : page}
          onNewInvoice={() => navigate('capture')}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
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
        </main>
      </div>
      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
    </EntityProvider>
  )
}
