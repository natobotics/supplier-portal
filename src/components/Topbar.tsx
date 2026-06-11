import { Search, Bell, Plus, Building } from 'lucide-react'
import { Button } from './ui'
import { entities, notifications } from '../data'
import { useEntity } from '../context'

export function Topbar({
  title,
  onNewInvoice,
  onOpenNotifications,
}: {
  title: string
  onNewInvoice: () => void
  onOpenNotifications: () => void
}) {
  const { entity, setEntity } = useEntity()
  const unreadCount = notifications.filter((n) => !n.read).length
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-6">
      <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <label className="relative hidden xl:block">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search invoices, suppliers, POs…"
            aria-label="Search"
            className="w-64 rounded-lg border border-line bg-canvas py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
        </label>
        <label className="relative hidden md:block">
          <Building
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            aria-label="Entity"
            className="cursor-pointer appearance-none rounded-lg border border-line bg-canvas py-2 pr-8 pl-9 text-sm font-medium text-ink focus:border-primary focus:outline-none"
          >
            <option value="all">All entities (GBP)</option>
            {entities
              .filter((e) => e.active)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.currency})
                </option>
              ))}
          </select>
        </label>
        <button
          onClick={onOpenNotifications}
          className="relative cursor-pointer rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          aria-label={`Notifications — ${unreadCount} unread`}
        >
          <Bell size={18} aria-hidden="true" />
          {notifications.some((n) => !n.read) && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
          )}
        </button>
        <Button onClick={onNewInvoice}>
          <Plus size={15} aria-hidden="true" />
          Add invoice
        </Button>
      </div>
    </header>
  )
}
