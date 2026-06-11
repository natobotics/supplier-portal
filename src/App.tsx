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
      <Sidebar page={page} onNavigate={navigate} onOpenCopilot={() => setCopilotOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={invoice ? 'Invoice detail' : titles[page]}
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
