import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  MailPlus,
  Minus,
  Plus,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { entities, entityById, portalUsers } from '../data'
import { cls, fmtDateShort } from '../utils'
import { useEntity } from '../context'
import type { PortalRole, PortalUser } from '../types'

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-offset-0 focus:outline-primary'

const ROLE_OPTIONS: PortalRole[] = [
  'AP Clerk',
  'AP Manager',
  'HR',
  'Line Manager',
  'Budget Owner',
  'Finance Head',
  'CEO',
  'Auditor',
  'Admin',
]

// Capability columns for the role matrix
const CAPABILITIES = ['Capture', 'Approve step', 'Pay', 'Configure', 'Audit view'] as const

const ROLE_MATRIX: Array<{ role: PortalRole; caps: [boolean, boolean, boolean, boolean, boolean] }> = [
  { role: 'AP Clerk', caps: [true, false, false, false, false] },
  { role: 'AP Manager', caps: [true, true, false, false, false] },
  { role: 'HR', caps: [false, true, false, false, false] },
  { role: 'Line Manager', caps: [false, true, false, false, false] },
  { role: 'Budget Owner', caps: [false, true, false, false, false] },
  { role: 'Finance Head', caps: [false, true, true, false, false] },
  { role: 'CEO', caps: [false, true, false, false, false] },
  { role: 'Auditor', caps: [false, false, false, false, true] },
  { role: 'Admin', caps: [true, true, true, true, true] },
]

function rolePillCls(role: PortalRole): string {
  if (role === 'Admin') return 'bg-primary text-white'
  if (role === 'CEO' || role === 'Finance Head') return 'bg-info-soft text-secondary'
  if (role === 'HR' || role === 'Line Manager') return 'bg-accent-soft text-accent'
  if (role === 'Auditor') return 'border border-line bg-canvas text-ink-soft'
  return 'bg-canvas text-ink-soft'
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function shortEntityName(id: string): string {
  return entityById(id)?.name.replace(/^NCons /, '') ?? id
}

const statusMeta: Record<PortalUser['status'], { label: string; dot: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-accent', text: 'text-ink-soft' },
  invited: { label: 'Invited', dot: 'bg-warn', text: 'text-warn' },
  deactivated: { label: 'Deactivated', dot: 'bg-ink-faint', text: 'text-ink-faint' },
}

interface InviteForm {
  name: string
  email: string
  role: PortalRole
  allEntities: boolean
  entityIds: string[]
}

const emptyInvite: InviteForm = {
  name: '',
  email: '',
  role: 'AP Clerk',
  allEntities: false,
  entityIds: [],
}

interface DelegationForm {
  userId: string
  to: string
  from: string
  until: string
}

const emptyDelegation: DelegationForm = { userId: '', to: '', from: '2026-06-11', until: '' }

export function Users() {
  const { entity } = useEntity()
  const [users, setUsers] = useState<PortalUser[]>(portalUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState<InviteForm>(emptyInvite)
  const [banner, setBanner] = useState<string | null>(null)
  const [delegation, setDelegation] = useState<DelegationForm>(emptyDelegation)

  // ---- KPIs ----
  const activeCount = users.filter((u) => u.status === 'active').length
  const invitedCount = users.filter((u) => u.status === 'invited').length
  const delegations = users.filter(
    (u): u is PortalUser & { delegation: NonNullable<PortalUser['delegation']> } =>
      u.delegation !== undefined,
  )
  const rolesInUse = new Set(users.filter((u) => u.status !== 'deactivated').map((u) => u.role)).size

  const kpis = [
    { label: 'Active users', value: String(activeCount), sub: `${users.length} on the portal`, icon: UserCheck },
    { label: 'Pending invites', value: String(invitedCount), sub: 'Magic link sent', icon: MailPlus },
    { label: 'Active delegations', value: String(delegations.length), sub: 'Approval cover windows', icon: ArrowRightLeft },
    { label: 'Roles in use', value: String(rolesInUse), sub: `${ROLE_MATRIX.length} defined`, icon: ShieldCheck },
  ]

  const rows =
    entity === 'all'
      ? users
      : users.filter((u) => u.entityIds === 'all' || u.entityIds.includes(entity))

  // ---- Mutations ----
  const toggleStatus = (id: string) =>
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'deactivated' ? 'active' : 'deactivated' }
          : u,
      ),
    )

  const submitInvite = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const name = invite.name.trim()
    const email = invite.email.trim()
    if (!name || !email || (!invite.allEntities && invite.entityIds.length === 0)) return
    setUsers((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: invite.role,
        entityIds: invite.allEntities ? 'all' : invite.entityIds,
        status: 'invited',
      },
    ])
    setBanner(`Invite sent to ${name} (${email}) — ${invite.role}.`)
    setInvite(emptyInvite)
    setShowInvite(false)
  }

  const submitDelegation = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const { userId, to, from, until } = delegation
    if (!userId || !to || !from || !until) return
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, delegation: { to, from, until } } : u)),
    )
    setDelegation(emptyDelegation)
  }

  const activeUsers = users.filter((u) => u.status === 'active')
  const delegateOptions = activeUsers.filter((u) => u.id !== delegation.userId)

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-ink">Users & roles</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <UsersIcon size={13} aria-hidden="true" /> Access changes are audit-logged
          </p>
        </div>
        <Button onClick={() => setShowInvite((v) => !v)}>
          <Plus size={14} aria-hidden="true" /> Invite user
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 text-ink-faint">
              <k.icon size={15} aria-hidden="true" />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <p className="tabular mt-2 font-mono text-xl font-semibold text-ink">{k.value}</p>
            <p className="mt-0.5 truncate text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Invite success banner */}
      {banner && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-line bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent"
        >
          <CheckCircle2 size={15} aria-hidden="true" />
          {banner}
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardHeader
            title="Invite user"
            subtitle="Invites send a magic link in production — SSO via Entra ID planned."
          />
          <form onSubmit={submitInvite} className="space-y-4 p-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inv-name" className="mb-1 block text-xs font-medium text-ink-soft">
                  Full name
                </label>
                <input
                  id="inv-name"
                  required
                  value={invite.name}
                  onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                  placeholder="Alex Morgan"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="inv-email" className="mb-1 block text-xs font-medium text-ink-soft">
                  Email
                </label>
                <input
                  id="inv-email"
                  required
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="alex.morgan@nconsulting.ltd.uk"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="inv-role" className="mb-1 block text-xs font-medium text-ink-soft">
                  Role
                </label>
                <select
                  id="inv-role"
                  value={invite.role}
                  onChange={(e) => setInvite({ ...invite, role: e.target.value as PortalRole })}
                  className={inputCls}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="mb-1 block text-xs font-medium text-ink-soft">
                  Entity scope
                </legend>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line bg-surface px-3 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={invite.allEntities}
                      onChange={(e) =>
                        setInvite({ ...invite, allEntities: e.target.checked, entityIds: [] })
                      }
                      className="accent-[var(--color-primary)]"
                    />
                    All entities
                  </label>
                  {entities.map((e) => (
                    <label
                      key={e.id}
                      className={cls(
                        'flex items-center gap-2 text-[13px]',
                        invite.allEntities ? 'cursor-not-allowed text-ink-faint' : 'cursor-pointer text-ink-soft',
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={invite.allEntities}
                        checked={invite.entityIds.includes(e.id)}
                        onChange={(ev) =>
                          setInvite({
                            ...invite,
                            entityIds: ev.target.checked
                              ? [...invite.entityIds, e.id]
                              : invite.entityIds.filter((id) => id !== e.id),
                          })
                        }
                        className="accent-[var(--color-primary)]"
                      />
                      {e.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <MailPlus size={14} aria-hidden="true" /> Send invite
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowInvite(false)
                  setInvite(emptyInvite)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* User table */}
      <Card>
        <CardHeader
          title="Portal users"
          subtitle={
            entity === 'all'
              ? 'All entities — deactivation takes effect immediately'
              : 'Filtered to users scoped to the selected entity'
          }
        />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-medium text-ink-faint uppercase">
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Entity scope</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Last active</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => {
                const meta = statusMeta[u.status]
                const scoped = u.entityIds === 'all' ? [] : u.entityIds
                return (
                  <tr key={u.id} className={cls(u.status === 'deactivated' && 'opacity-60')}>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-semibold text-primary">
                          {initials(u.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{u.name}</span>
                          <span className="block truncate text-[11px] text-ink-faint">
                            {u.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cls(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                          rolePillCls(u.role),
                        )}
                      >
                        {u.role === 'Auditor' ? 'Auditor · read-only' : u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {u.entityIds === 'all' ? (
                        <span className="inline-flex items-center rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-secondary">
                          All entities
                        </span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {scoped.slice(0, 3).map((id) => (
                            <span
                              key={id}
                              className="inline-flex items-center rounded-full border border-line px-1.5 py-px text-[10px] text-ink-soft whitespace-nowrap"
                            >
                              {shortEntityName(id)}
                            </span>
                          ))}
                          {scoped.length > 3 && (
                            <span className="inline-flex items-center rounded-full border border-line px-1.5 py-px text-[10px] text-ink-faint">
                              +{scoped.length - 3}
                            </span>
                          )}
                        </span>
                      )}
                      {u.delegation && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-medium text-secondary">
                          <ArrowRightLeft size={10} aria-hidden="true" />
                          Delegating to {u.delegation.to} until {fmtDateShort(u.delegation.until)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cls('flex items-center gap-1.5 text-xs font-medium', meta.text)}>
                        <span className={cls('h-1.5 w-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap text-ink-faint">
                      {u.lastActive ?? '—'}
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" onClick={() => toggleStatus(u.id)}>
                        {u.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-ink-faint">
                    No users scoped to the current entity filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Active delegations */}
        <Card>
          <CardHeader
            title="Active delegations"
            subtitle="Approval queue items route to the delegate — recorded in the audit log"
          />
          <div className="space-y-2.5 p-5 pt-2">
            {delegations.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
              >
                <ArrowRightLeft size={15} className="text-secondary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    {u.name} → {u.delegation.to}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {fmtDateShort(u.delegation.from)} – {fmtDateShort(u.delegation.until)} ·{' '}
                    {u.role}
                  </p>
                </div>
              </div>
            ))}
            {delegations.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-faint">No active delegations.</p>
            )}

            <form onSubmit={submitDelegation} className="space-y-3 border-t border-line pt-4">
              <p className="text-xs font-semibold text-ink">Add delegation</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="del-user" className="mb-1 block text-xs font-medium text-ink-soft">
                    User
                  </label>
                  <select
                    id="del-user"
                    required
                    value={delegation.userId}
                    onChange={(e) => setDelegation({ ...delegation, userId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      Select user…
                    </option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="del-to" className="mb-1 block text-xs font-medium text-ink-soft">
                    Delegate to
                  </label>
                  <select
                    id="del-to"
                    required
                    value={delegation.to}
                    onChange={(e) => setDelegation({ ...delegation, to: e.target.value })}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      Select delegate…
                    </option>
                    {delegateOptions.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="del-from" className="mb-1 block text-xs font-medium text-ink-soft">
                    From
                  </label>
                  <input
                    id="del-from"
                    required
                    type="date"
                    value={delegation.from}
                    onChange={(e) => setDelegation({ ...delegation, from: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="del-until" className="mb-1 block text-xs font-medium text-ink-soft">
                    Until
                  </label>
                  <input
                    id="del-until"
                    required
                    type="date"
                    value={delegation.until}
                    onChange={(e) => setDelegation({ ...delegation, until: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <Button>
                <Plus size={14} aria-hidden="true" /> Add delegation
              </Button>
            </form>
          </div>
        </Card>

        {/* Role matrix */}
        <Card>
          <CardHeader
            title="Role matrix"
            subtitle="Capabilities per role — enforced on every action"
          />
          <div className="overflow-x-auto px-5 pb-4">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] font-medium text-ink-faint uppercase">
                  <th className="py-2 pr-3 font-medium">Role</th>
                  {CAPABILITIES.map((c) => (
                    <th key={c} className="px-1 py-2 text-center font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ROLE_MATRIX.map((row) => (
                  <tr key={row.role}>
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-ink">
                      {row.role}
                    </td>
                    {row.caps.map((has, i) => (
                      <td key={CAPABILITIES[i]} className="px-1 py-2.5 text-center">
                        {has ? (
                          <Check size={14} className="inline text-accent" aria-label="Allowed" />
                        ) : (
                          <Minus
                            size={14}
                            className="inline text-ink-faint/60"
                            aria-label="Not allowed"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
