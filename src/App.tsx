import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Copilot } from './components/Copilot'
import { Dashboard } from './pages/Dashboard'
import { Invoices } from './pages/Invoices'
import { InvoiceDetail } from './pages/InvoiceDetail'
import { Capture } from './pages/Capture'
import { Approvals } from './pages/Approvals'
import { Payments } from './pages/Payments'
import { Suppliers } from './pages/Suppliers'
import { Reports } from './pages/Reports'
import type { Page, Invoice } from './types'

const titles: Record<Page, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  capture: 'Invoice capture',
  approvals: 'Approvals',
  payments: 'Payments',
  suppliers: 'Suppliers',
  reports: 'Reports',
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)

  const navigate = (p: Page) => {
    setInvoice(null)
    setPage(p)
  }

  const openInvoice = (inv: Invoice) => {
    setPage('invoices')
    setInvoice(inv)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={page} onNavigate={navigate} onOpenCopilot={() => setCopilotOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={invoice ? 'Invoice detail' : titles[page]}
          onNewInvoice={() => navigate('capture')}
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
          ) : page === 'approvals' ? (
            <Approvals onOpen={openInvoice} />
          ) : page === 'payments' ? (
            <Payments />
          ) : page === 'suppliers' ? (
            <Suppliers />
          ) : (
            <Reports />
          )}
        </main>
      </div>
      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  )
}
