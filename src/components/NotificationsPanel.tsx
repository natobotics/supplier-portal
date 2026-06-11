import { useEffect, useState } from 'react'
import { Bell, CheckSquare, Clock, CreditCard, ShieldAlert, X } from 'lucide-react'
import type { AppNotification } from '../types'
import { notifications, supplierById } from '../data'
import { cls } from '../utils'
import { Button } from './ui'

type Tab = 'all' | 'internal' | 'supplier'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'internal', label: 'Internal' },
  { id: 'supplier', label: 'Supplier-facing' },
]

const KIND_STYLE: Record<AppNotification['kind'], { icon: typeof Bell; cls: string }> = {
  timesheet: { icon: Clock, cls: 'bg-info-soft text-secondary' },
  approval: { icon: CheckSquare, cls: 'bg-warn-soft text-warn' },
  payment: { icon: CreditCard, cls: 'bg-accent-soft text-accent' },
  compliance: { icon: ShieldAlert, cls: 'bg-danger-soft text-danger' },
  status: { icon: Bell, cls: 'bg-canvas text-ink-soft' },
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<AppNotification[]>(notifications)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const unread = items.filter((n) => !n.read).length
  const visible = tab === 'all' ? items : items.filter((n) => n.audience === tab)

  const markRead = (id: string) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, read: true })))

  return (
    <>
      {/* Scrim */}
      <div
        className={cls(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cls(
          'fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            {unread > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
                {unread} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={markAllRead}
              disabled={unread === 0}
              className="px-2.5 py-1.5 text-xs"
            >
              Mark all read
            </Button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="cursor-pointer rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex gap-1.5 border-b border-line px-5 py-3" role="tablist" aria-label="Filter notifications">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cls(
                'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'bg-primary text-white'
                  : 'bg-canvas text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-faint">No notifications here.</p>
          )}
          <ul className="divide-y divide-line">
            {visible.map((n) => {
              const k = KIND_STYLE[n.kind]
              const Icon = k.icon
              const supplier = n.audience === 'supplier' && n.supplierId ? supplierById(n.supplierId) : undefined
              return (
                <li key={n.id}>
                  <button
                    onClick={() => markRead(n.id)}
                    className={cls(
                      'flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-canvas/60',
                      !n.read && 'bg-canvas',
                    )}
                  >
                    <span
                      className={cls(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        k.cls,
                      )}
                    >
                      <Icon size={14} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-ink">{n.title}</span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-soft">
                        {n.body}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-ink-faint">{n.ts}</span>
                        {supplier && (
                          <span className="inline-flex items-center rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-secondary">
                            → {supplier.name}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <footer className="border-t border-line px-5 py-3">
          <p className="text-[11px] text-ink-faint">
            Production: these mirror to email via the notification service — suppliers see only
            their own.
          </p>
        </footer>
      </aside>
    </>
  )
}
