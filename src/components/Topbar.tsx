import { Search, Bell, Plus } from 'lucide-react'
import { Button } from './ui'

export function Topbar({
  title,
  onNewInvoice,
}: {
  title: string
  onNewInvoice: () => void
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <label className="relative hidden md:block">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search invoices, suppliers, POs…"
            aria-label="Search"
            className="w-72 rounded-lg border border-line bg-canvas py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
        </label>
        <button
          className="relative cursor-pointer rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Notifications — 3 unread"
        >
          <Bell size={18} aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <Button onClick={onNewInvoice}>
          <Plus size={15} aria-hidden="true" />
          Add invoice
        </Button>
      </div>
    </header>
  )
}
