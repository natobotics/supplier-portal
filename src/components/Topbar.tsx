import { useEffect, useRef, useState } from 'react'
import { Search, Bell, Plus, Building, HelpCircle } from 'lucide-react'
import { Button, Card } from './ui'
import { entities, notifications } from '../data'
import { useEntity } from '../context'
import { useAuth, canCapture } from '../lib/auth'
import { PAGE_HELP } from '../help'
import type { Page } from '../types'

export function Topbar({
  title,
  page,
  onNewInvoice,
  onOpenNotifications,
}: {
  title: string
  page?: string
  onNewInvoice: () => void
  onOpenNotifications: () => void
}) {
  const { entity, setEntity } = useEntity()
  const { role } = useAuth()
  const isSupplier = role === 'supplier'
  const unreadCount = notifications.filter((n) => !n.read).length

  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  // 'invoice-detail' is not a Page — fall back to the invoices help entry.
  const helpKey = page === 'invoice-detail' ? 'invoices' : page
  const help = helpKey && helpKey in PAGE_HELP ? PAGE_HELP[helpKey as Page] : undefined

  // Close the popover when navigating to another page.
  useEffect(() => {
    setHelpOpen(false)
  }, [page])

  useEffect(() => {
    if (!helpOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [helpOpen])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-6">
      <div ref={helpRef} className="relative flex items-center gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-ink">{title}</h1>
        {help && (
          <>
            <button
              onClick={() => setHelpOpen((o) => !o)}
              aria-label="Page help"
              aria-expanded={helpOpen}
              className="cursor-pointer rounded-md p-1 text-ink-faint transition-colors duration-150 hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              <HelpCircle size={16} aria-hidden="true" />
            </button>
            {helpOpen && (
              <Card className="absolute top-full left-0 z-50 mt-1.5 w-80 p-4 shadow-lg">
                <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                  About this page
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink">{help.what}</p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-ink-soft">
                  {help.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {!isSupplier && (
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
        )}
        {!isSupplier && (
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
        )}
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
        {canCapture(role) && (
          <Button onClick={onNewInvoice}>
            <Plus size={15} aria-hidden="true" />
            Add invoice
          </Button>
        )}
      </div>
    </header>
  )
}
