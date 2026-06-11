import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  Globe,
  Info,
  Landmark,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/ui'
import { entities, purchaseOrders, supplierById, entityById } from '../data'
import { useEntity } from '../context'
import { fmtDate, daysUntil, cls } from '../utils'
import type { IR35Info, PurchaseOrder } from '../types'

type LaborPO = PurchaseOrder & { ir35: IR35Info }

const ir35Pill: Record<IR35Info['status'], { label: string; cls: string }> = {
  inside: { label: 'Inside IR35', cls: 'bg-danger-soft text-danger' },
  outside: { label: 'Outside IR35', cls: 'bg-accent-soft text-accent' },
  not_applicable: { label: 'N/A', cls: 'border border-line bg-canvas text-ink-faint' },
}

const routeLabel: Record<NonNullable<IR35Info['route']>, string> = {
  umbrella: 'Umbrella',
  payroll: 'Payroll',
}

const sdsExpiringSoon = (ir35: IR35Info) =>
  ir35.sdsExpiry !== undefined && daysUntil(ir35.sdsExpiry) <= 60

const sdsAtRisk = (ir35: IR35Info) => !ir35.sdsOnFile || sdsExpiringSoon(ir35)

function sdsSummary(ir35: IR35Info): string {
  if (!ir35.sdsOnFile) return 'SDS missing'
  return ir35.sdsExpiry ? `SDS on file — expires ${fmtDate(ir35.sdsExpiry)}` : 'SDS on file'
}

function SdsCell({ ir35 }: { ir35: IR35Info }) {
  if (ir35.sdsOnFile) {
    const expiring = sdsExpiringSoon(ir35)
    return (
      <span
        className={cls(
          'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
          expiring ? 'text-warn' : 'text-ink-soft',
        )}
      >
        <FileCheck2 size={13} aria-hidden="true" />
        On file{ir35.sdsExpiry ? ` · exp ${fmtDate(ir35.sdsExpiry)}` : ''}
      </span>
    )
  }
  if (ir35.status === 'inside') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-danger">
        <FileWarning size={13} aria-hidden="true" /> Missing
      </span>
    )
  }
  return <span className="text-xs text-ink-faint">Not required</span>
}

interface QueueDef {
  poId: string
  tone: 'danger' | 'warn' | 'ok'
  message: string
  chase?: boolean
}

const queueDefs: QueueDef[] = [
  { poId: 'po-08', tone: 'danger', message: 'Block first invoice until SDS on file', chase: true },
  {
    poId: 'po-05',
    tone: 'warn',
    message: 'Route invoices to payroll deemed-payment run — standard payment blocked',
  },
  { poId: 'po-01', tone: 'ok', message: 'No action — re-assess at renewal' },
]

const queueTone = {
  danger: { row: 'border-danger/30 bg-danger-soft', icon: 'text-danger', Icon: ShieldAlert },
  warn: { row: 'border-warn/30 bg-warn-soft', icon: 'text-warn', Icon: AlertTriangle },
  ok: { row: 'border-accent/30 bg-accent-soft', icon: 'text-accent', Icon: ShieldCheck },
} as const

interface WatchDef {
  entityId: string
  jurisdiction: string
  regime: string
  detail: string
}

// Reference summary of the per-country invoice mandates enforced by the
// compliance engine (src/compliance/rules.ts) on top of the common checks.
const COUNTRY_RULES_REF: Record<string, Array<{ label: string; detail: string }>> = {
  'United Kingdom': [
    {
      label: 'UK VAT registration on file',
      detail: 'VAT-registered suppliers must show their VAT number (HMRC VAT Notice 700/21).',
    },
    {
      label: 'Cross-border VAT treatment stated',
      detail:
        'Foreign-supplier service invoices need reverse-charge wording (or proof VAT was correctly charged).',
    },
    {
      label: 'IR35 routing respected',
      detail: 'Inside-IR35 engagements must route via umbrella or payroll deemed payment.',
    },
  ],
  Germany: [
    {
      label: 'USt-IdNr / Steuernummer on file',
      detail: '§14 UStG requires the supplier tax number or VAT ID on every invoice.',
    },
    {
      label: 'Sequential invoice number (§14 UStG)',
      detail: 'German invoices must use a consecutive, unique numbering range.',
    },
    {
      label: 'Date of supply stated',
      detail: '§14 UStG requires the delivery/service date distinct from the issue date.',
    },
  ],
  Spain: [
    {
      label: 'NIF / NIF-IVA on file',
      detail: 'Spanish invoices require the issuer NIF; IVA breakdown per rate.',
    },
  ],
  Netherlands: [
    {
      label: 'BTW-nummer on file',
      detail: 'Dutch invoices require the supplier BTW (VAT) number.',
    },
  ],
  Poland: [
    { label: 'NIP on file', detail: 'Polish invoices require the supplier NIP.' },
    {
      label: 'KSeF structured e-invoice',
      detail:
        'Poland mandates structured e-invoicing via KSeF — PDF-only invoices are non-compliant.',
    },
  ],
  'UAE (Dubai)': [
    {
      label: 'TRN on file',
      detail: 'UAE tax invoices require the supplier Tax Registration Number.',
    },
    {
      label: '“Tax Invoice” label present',
      detail: 'FTA requires the literal words “Tax Invoice” on the document.',
    },
  ],
  India: [
    { label: 'GSTIN on file', detail: 'Indian invoices require supplier and recipient GSTIN.' },
    {
      label: 'HSN/SAC code per line',
      detail: 'GST invoices must classify each line with an HSN (goods) or SAC (services) code.',
    },
    {
      label: 'TDS withholding assessed',
      detail: 'Contractor payments may require tax deduction at source before settlement.',
    },
  ],
  Singapore: [
    {
      label: 'GST registration on file',
      detail:
        'GST-registered suppliers must show their GST number; “Tax Invoice” label required above SGD 1,000.',
    },
  ],
  Sweden: [
    {
      label: 'Momsregistreringsnummer on file',
      detail: 'Swedish invoices require the supplier VAT (moms) number.',
    },
  ],
  'United States': [
    {
      label: 'W-9 / W-8 on file',
      detail:
        'No federal invoice mandate, but a valid W-9 (or W-8 for foreign payees) is required before payment for 1099 reporting.',
    },
  ],
}

export function Compliance() {
  const { entity } = useEntity()
  const [chasedPoIds, setChasedPoIds] = useState<string[]>([])
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)

  const ruleCountries = [...new Set(entities.map((e) => e.country))]

  const laborPOs = purchaseOrders.filter((p): p is LaborPO => p.ir35 !== undefined)
  const visible = entity === 'all' ? laborPOs : laborPOs.filter((p) => p.entityId === entity)

  const insideCount = visible.filter((p) => p.ir35.status === 'inside').length
  const outsideCount = visible.filter((p) => p.ir35.status === 'outside').length
  const sdsRiskCount = visible.filter((p) => sdsAtRisk(p.ir35)).length

  const kpis = [
    { label: 'Engagements assessed', value: visible.length, sub: 'labor POs with a determination', icon: ClipboardCheck },
    { label: 'Inside IR35', value: insideCount, sub: 'umbrella or payroll route required', icon: ShieldAlert },
    { label: 'Outside IR35', value: outsideCount, sub: 'standard supplier payment allowed', icon: ShieldCheck },
    { label: 'SDS missing / expiring', value: sdsRiskCount, sub: 'not on file or expiring within 60 days', icon: FileWarning },
  ]

  const queue = queueDefs.flatMap((def) => {
    const po = laborPOs.find((p) => p.id === def.poId)
    if (!po || (entity !== 'all' && po.entityId !== entity)) return []
    return [{ def, po }]
  })

  // Non-UK jurisdiction watchlist
  const dePo = laborPOs.find((p) => p.id === 'po-03')
  const watchlist: WatchDef[] = [
    {
      entityId: 'ent-de',
      jurisdiction: 'Germany',
      regime: 'AÜG labor leasing',
      detail: dePo
        ? `Extended retainer engagements may need an Arbeitnehmerüberlassung licence — watching ${dePo.number} (${supplierById(dePo.supplierId).name}, DevOps retainer).`
        : 'No labor engagements under watch.',
    },
    {
      entityId: 'ent-in',
      jurisdiction: 'India',
      regime: 'TDS withholding',
      detail:
        'Placeholder — Section 194 tax deducted at source applies once contractor spend begins. No active labor engagements yet.',
    },
  ]
  const visibleWatchlist =
    entity === 'all' ? watchlist : watchlist.filter((w) => w.entityId === entity)

  return (
    <div className="space-y-5 p-6">
      {/* Explainer strip */}
      <Card className="bg-info-soft">
        <div className="flex items-start gap-2.5 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">UK off-payroll rules (IR35):</span> every UK labor
            engagement needs a status determination statement (SDS) before first payment. Inside-IR35
            engagements route via an umbrella company or a payroll deemed-payment run — never a
            standard supplier payment.
          </p>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-1.5 text-ink-faint">
              <k.icon size={14} aria-hidden="true" />
              <span className="text-xs font-medium">{k.label}</span>
            </div>
            <p className="tabular mt-2 font-mono text-xl font-semibold text-ink">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Engagements table */}
      <Card>
        <CardHeader
          title="Labor engagements"
          subtitle="Status determinations across all purchase orders for labor"
        />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-wide text-ink-faint uppercase">
                <th className="pb-2 pr-3 font-medium">PO</th>
                <th className="pb-2 pr-3 font-medium">Supplier</th>
                <th className="pb-2 pr-3 font-medium">Entity</th>
                <th className="pb-2 pr-3 font-medium">IR35 status</th>
                <th className="pb-2 pr-3 font-medium">Route</th>
                <th className="pb-2 pr-3 font-medium">SDS</th>
                <th className="pb-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((po) => {
                const supplier = supplierById(po.supplierId)
                const pill = ir35Pill[po.ir35.status]
                return (
                  <tr key={po.id} className="text-[13px]">
                    <td className="py-3 pr-3 font-mono font-medium whitespace-nowrap text-ink">
                      {po.number}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-ink">{supplier.name}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-ink-soft">
                      {entityById(po.entityId)?.name ?? po.entityId}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cls(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                          pill.cls,
                        )}
                      >
                        {pill.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-ink-soft">
                      {po.ir35.route ? routeLabel[po.ir35.route] : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <SdsCell ir35={po.ir35} />
                    </td>
                    <td className="max-w-[240px] py-3">
                      {po.ir35.note ? (
                        <p className="truncate text-xs text-ink-soft" title={po.ir35.note}>
                          {po.ir35.note}
                        </p>
                      ) : (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-ink-faint">
                    No labor engagements for this entity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action queue */}
      <Card>
        <CardHeader
          title="Action queue"
          subtitle="Determinations that gate invoicing and payment routing"
        />
        <div className="space-y-2.5 p-5 pt-2">
          {queue.map(({ def, po }) => {
            const tone = queueTone[def.tone]
            const supplier = supplierById(po.supplierId)
            const chased = chasedPoIds.includes(po.id)
            return (
              <div
                key={po.id}
                className={cls(
                  'flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3',
                  tone.row,
                )}
              >
                <tone.Icon size={16} className={cls('shrink-0', tone.icon)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{def.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    <span className="font-mono">{po.number}</span> · {supplier.name} ·{' '}
                    {entityById(po.entityId)?.name ?? po.entityId} ·{' '}
                    {ir35Pill[po.ir35.status].label}
                    {po.ir35.route ? ` via ${routeLabel[po.ir35.route].toLowerCase()}` : ''} ·{' '}
                    {sdsSummary(po.ir35)}
                  </p>
                </div>
                {def.chase &&
                  (chased ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <CheckCircle2 size={14} aria-hidden="true" /> SDS requested
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => setChasedPoIds((ids) => [...ids, po.id])}
                    >
                      Chase SDS
                    </Button>
                  ))}
              </div>
            )
          })}
          {queue.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-faint">
              No compliance actions for this entity.
            </p>
          )}
        </div>
      </Card>

      {/* Non-UK jurisdiction watchlist */}
      <Card>
        <CardHeader
          title="Jurisdiction watchlist"
          subtitle="Non-UK labor compliance regimes monitored by group finance"
        />
        <ul className="space-y-2.5 p-5 pt-2">
          {visibleWatchlist.map((w) => (
            <li
              key={w.entityId}
              className="flex items-start gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
            >
              <span className="mt-0.5 shrink-0 rounded-lg bg-surface p-2 text-ink-faint">
                {w.entityId === 'ent-de' ? (
                  <Landmark size={15} aria-hidden="true" />
                ) : (
                  <Globe size={15} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">
                  {w.jurisdiction} — {w.regime}
                  <span className="ml-2 text-[11px] font-normal text-ink-faint">
                    {entityById(w.entityId)?.name ?? w.entityId}
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{w.detail}</p>
              </div>
            </li>
          ))}
          {visibleWatchlist.length === 0 && (
            <li className="py-4 text-center text-sm text-ink-faint">
              No watchlist items for this entity.
            </li>
          )}
        </ul>
      </Card>

      {/* Country invoice rules reference */}
      <Card>
        <CardHeader
          title="Country invoice rules reference"
          subtitle="Country-specific mandates applied on top of the common invoice checks"
        />
        <ul className="divide-y divide-line px-5 pb-2">
          {ruleCountries.map((country) => {
            const rules = COUNTRY_RULES_REF[country] ?? []
            const expanded = expandedCountry === country
            return (
              <li key={country}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedCountry(expanded ? null : country)}
                  className="flex w-full cursor-pointer items-center gap-2.5 py-3 text-left"
                >
                  <ChevronRight
                    size={14}
                    className={cls(
                      'shrink-0 text-ink-faint transition-transform duration-200',
                      expanded && 'rotate-90',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-[13px] font-medium text-ink">{country}</span>
                  <span className="tabular text-[11px] text-ink-faint">
                    {rules.length} country rule{rules.length === 1 ? '' : 's'}
                  </span>
                </button>
                {expanded && (
                  <ul className="space-y-2.5 pb-3.5 pl-6">
                    {rules.map((r) => (
                      <li key={r.label}>
                        <p className="text-[13px] font-medium text-ink">{r.label}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">
                          {r.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
        <p className="flex items-center gap-1.5 px-5 pb-4 text-[11px] text-ink-faint">
          <Info size={13} aria-hidden="true" />
          Document checks run via Claude vision on the uploaded PDF in production.
        </p>
      </Card>
    </div>
  )
}
