import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud,
  Mail,
  Rss,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Minus,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, Button, ConfidenceBar } from '../components/ui'
import { invoices, supplierById, entityById } from '../data'
import { useEntity } from '../context'
import { fmtMoney, fmtDateShort, cls } from '../utils'
import { validateInvoice, complianceSummary } from '../compliance/rules'
import type { Invoice } from '../types'

const steps = [
  'Reading document…',
  'Extracting header fields…',
  'Matching supplier record…',
  'Coding line items to GL…',
  'Validating country compliance…',
  'Checking contract terms & rate card…',
  'Running anomaly checks…',
  'Done — ready for review',
]

const verdictPill: Record<
  ReturnType<typeof complianceSummary>['verdict'],
  { label: string; cls: string }
> = {
  compliant: { label: 'Compliant', cls: 'bg-accent-soft text-accent' },
  review: { label: 'Needs review', cls: 'bg-warn-soft text-warn' },
  non_compliant: { label: 'Non-compliant', cls: 'bg-danger-soft text-danger' },
}

// Shape returned by /.netlify/functions/extract (Claude vision extraction)
interface ExtractLine {
  description: string | null
  qty: number | null
  unit_price: number | null
  amount: number | null
}

interface ExtractResult {
  supplier_name: string | null
  invoice_number: string | null
  issue_date: string | null
  due_date: string | null
  currency: string | null
  total: number | null
  po_reference: string | null
  tax_id: string | null
  bank_account_hint: string | null
  lines: ExtractLine[]
  field_confidence: Array<{ field: string; confidence: number }>
  country_document_checks: Array<{ check: string; result: 'pass' | 'fail' | 'not_visible' }>
}

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_BYTES = 20 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result)
      const comma = s.indexOf(',')
      resolve(comma >= 0 ? s.slice(comma + 1) : s)
    }
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function fmtSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function fmtTotal(total: number | null, currency: string | null): string {
  if (typeof total !== 'number') return '—'
  const cur = currency && currency.length === 3 ? currency : 'USD'
  try {
    return fmtMoney(total, cur)
  } catch {
    return `${currency ?? ''} ${total.toLocaleString()}`.trim()
  }
}

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function confidenceFor(result: ExtractResult, field: string): number | undefined {
  const target = normKey(field)
  const hit = result.field_confidence.find((fc) => {
    const n = normKey(fc.field)
    return n === target || n.includes(target) || target.includes(n)
  })
  if (!hit || typeof hit.confidence !== 'number') return undefined
  return Math.max(0, Math.min(1, hit.confidence))
}

function normalizeExtract(data: Record<string, unknown>): ExtractResult {
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null)
  const num = (v: unknown) => (typeof v === 'number' ? v : null)
  return {
    supplier_name: str(data.supplier_name),
    invoice_number: str(data.invoice_number),
    issue_date: str(data.issue_date),
    due_date: str(data.due_date),
    currency: str(data.currency),
    total: num(data.total),
    po_reference: str(data.po_reference),
    tax_id: str(data.tax_id),
    bank_account_hint: str(data.bank_account_hint),
    lines: Array.isArray(data.lines)
      ? (data.lines as Record<string, unknown>[]).map((l) => ({
          description: str(l.description),
          qty: num(l.qty),
          unit_price: num(l.unit_price),
          amount: num(l.amount),
        }))
      : [],
    field_confidence: Array.isArray(data.field_confidence)
      ? (data.field_confidence as ExtractResult['field_confidence'])
      : [],
    country_document_checks: Array.isArray(data.country_document_checks)
      ? (data.country_document_checks as ExtractResult['country_document_checks'])
      : [],
  }
}

export function Capture({ onOpen }: { onOpen: (inv: Invoice) => void }) {
  const { entity } = useEntity()
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)
  const [extraction, setExtraction] = useState<ExtractResult | null>(null)
  const [extractFailed, setExtractFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const runRef = useRef(0)

  // Hold the animation on the penultimate step until the live response (or
  // failure) lands, then let it advance to 'Done'.
  const responseDone = extraction !== null || extractFailed
  useEffect(() => {
    if (!processing) return
    if (step >= steps.length - 1) return
    if (step === steps.length - 2 && !responseDone) return
    const t = setTimeout(() => setStep((s) => s + 1), 650)
    return () => clearTimeout(t)
  }, [processing, step, responseDone])

  function reset() {
    runRef.current++
    setProcessing(false)
    setStep(0)
    setFileMeta(null)
    setExtraction(null)
    setExtractFailed(false)
    setError(null)
  }

  function addToQueue() {
    reset()
    setBanner('Added to review queue — pending human confirmation')
  }

  async function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type — PDF, PNG or JPEG only.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File too large — maximum 20MB.')
      return
    }

    const run = ++runRef.current
    setBanner(null)
    setFileMeta({ name: file.name, size: file.size })
    setExtraction(null)
    setExtractFailed(false)
    setStep(0)
    setProcessing(true)

    const entityCountry =
      entity !== 'all' ? (entityById(entity)?.country ?? 'United Kingdom') : 'United Kingdom'

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 60_000)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/.netlify/functions/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_base64: base64,
          media_type: file.type,
          entity_country: entityCountry,
        }),
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`extract failed: ${res.status}`)
      const data: unknown = await res.json()
      if (runRef.current !== run) return
      setExtraction(normalizeExtract((data ?? {}) as Record<string, unknown>))
    } catch {
      // Local dev (404), network error or 60s timeout — fall back to demo mode.
      if (runRef.current === run) setExtractFailed(true)
    } finally {
      clearTimeout(timer)
    }
  }

  const queue = invoices.filter((i) => i.status === 'captured' || i.status === 'review')
  const animationDone = step >= steps.length - 1
  const anyFail =
    extraction !== null && extraction.country_document_checks.some((c) => c.result === 'fail')

  const resultFields: Array<{ label: string; key: string; value: string | null; mono?: boolean }> =
    extraction
      ? [
          { label: 'Supplier', key: 'supplier_name', value: extraction.supplier_name },
          {
            label: 'Invoice number',
            key: 'invoice_number',
            value: extraction.invoice_number,
            mono: true,
          },
          { label: 'Issue date', key: 'issue_date', value: extraction.issue_date },
          { label: 'Due date', key: 'due_date', value: extraction.due_date },
          {
            label: 'Total',
            key: 'total',
            value: fmtTotal(extraction.total, extraction.currency),
            mono: true,
          },
          { label: 'PO reference', key: 'po_reference', value: extraction.po_reference, mono: true },
          { label: 'Tax ID', key: 'tax_id', value: extraction.tax_id, mono: true },
          {
            label: 'Bank account',
            key: 'bank_account_hint',
            value: extraction.bank_account_hint,
            mono: true,
          },
        ]
      : []

  return (
    <div className="space-y-5 p-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Dropzone */}
        <Card className="lg:col-span-2">
          <CardHeader title="Capture invoices" subtitle="AI extracts fields, codes GL lines and runs fraud checks automatically" />
          <div className="p-5 pt-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
                e.target.value = ''
              }}
            />
            {banner && (
              <div
                className="mb-3 flex items-center gap-2 rounded-lg bg-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-accent"
                role="status"
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                {banner}
              </div>
            )}
            {!processing ? (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f) void handleFile(f)
                  }}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-canvas px-6 py-14 transition-colors hover:border-secondary/50 hover:bg-info-soft/30"
                >
                  <span className="rounded-full bg-info-soft p-3.5 text-secondary">
                    <UploadCloud size={26} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-ink">
                    Drop invoices here or <span className="text-secondary">browse files</span>
                  </span>
                  <span className="text-xs text-ink-faint">PDF, PNG, JPEG · up to 20MB each</span>
                </button>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              </>
            ) : extraction && animationDone && fileMeta ? (
              /* Extraction result — live fields from Claude vision */
              <div className="rounded-xl border border-line bg-canvas p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-surface p-2.5 text-ink-faint shadow-sm">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{fileMeta.name}</p>
                    <p className="text-[11px] text-ink-faint">
                      {fmtSize(fileMeta.size)} · extracted by Claude
                    </p>
                  </div>
                  <span
                    className={cls(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                      anyFail ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent',
                    )}
                  >
                    {anyFail ? 'Compliance issues found' : 'Checks passed'}
                  </span>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {resultFields.map((f) => {
                    const conf = confidenceFor(extraction, f.key)
                    return (
                      <div key={f.key}>
                        <dt className="text-[11px] text-ink-faint">{f.label}</dt>
                        <dd className="mt-0.5 flex items-center justify-between gap-2">
                          <span
                            className={cls(
                              'truncate text-[13px] text-ink',
                              f.mono && 'font-mono tabular',
                            )}
                          >
                            {f.value ?? '—'}
                          </span>
                          {conf !== undefined && <ConfidenceBar value={conf} />}
                        </dd>
                      </div>
                    )
                  })}
                </dl>

                {extraction.lines.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-line">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-line bg-surface text-[11px] text-ink-faint">
                          <th className="px-3 py-1.5 font-medium">Line item</th>
                          <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                          <th className="px-3 py-1.5 text-right font-medium">Unit price</th>
                          <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-surface">
                        {extraction.lines.map((l, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-ink">{l.description ?? '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono tabular text-ink-soft">
                              {l.qty ?? '—'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono tabular text-ink-soft">
                              {l.unit_price ?? '—'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono tabular text-ink">
                              {l.amount ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {extraction.country_document_checks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-medium text-ink-faint">
                      Country document checks
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {extraction.country_document_checks.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-[13px]">
                          {c.result === 'pass' ? (
                            <CheckCircle2 size={14} className="shrink-0 text-accent" aria-hidden="true" />
                          ) : c.result === 'fail' ? (
                            <XCircle size={14} className="shrink-0 text-danger" aria-hidden="true" />
                          ) : (
                            <Minus size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />
                          )}
                          <span className={c.result === 'fail' ? 'text-ink' : 'text-ink-soft'}>
                            {c.check}
                          </span>
                          {c.result === 'not_visible' && (
                            <span className="text-[11px] text-ink-faint">not visible</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <Button className="flex-1" onClick={addToQueue}>
                    Add to review queue
                  </Button>
                  <Button variant="secondary" onClick={reset}>
                    Capture another
                  </Button>
                </div>
              </div>
            ) : (
              /* Processing pipeline (and demo-mode completion on fallback) */
              <div className="rounded-xl border border-line bg-canvas px-6 py-10">
                <div className="mx-auto max-w-sm">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-surface p-2.5 text-ink-faint shadow-sm">
                      <FileText size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {fileMeta?.name ?? 'invoice.pdf'}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {fileMeta ? fmtSize(fileMeta.size) : ''}
                      </p>
                    </div>
                    {animationDone ? (
                      <CheckCircle2 size={20} className="text-accent" aria-label="Complete" />
                    ) : (
                      <Loader2 size={20} className="animate-spin text-secondary" aria-label="Processing" />
                    )}
                  </div>
                  <ol className="mt-5 space-y-2" aria-live="polite">
                    {steps.map((s, i) => (
                      <li
                        key={s}
                        className={cls(
                          'flex items-center gap-2 text-[13px] transition-colors duration-300',
                          i < step ? 'text-accent' : i === step ? 'font-medium text-ink' : 'text-ink-faint',
                        )}
                      >
                        {i < step ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : i === step && step < steps.length - 1 ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        ) : i === step ? (
                          <CheckCircle2 size={14} className="text-accent" aria-hidden="true" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-line" aria-hidden="true" />
                        )}
                        {s}
                      </li>
                    ))}
                  </ol>
                  {animationDone && extractFailed && (
                    <div className="mt-5">
                      <p className="text-[11px] text-ink-faint">
                        Live extraction unavailable — demo mode
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button className="flex-1" onClick={reset}>
                          Review extraction
                        </Button>
                        <Button variant="secondary" onClick={reset}>
                          Capture another
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Intake channels */}
        <Card>
          <CardHeader title="Intake channels" subtitle="Invoices flow in automatically" />
          <ul className="space-y-3 p-5 pt-2">
            <li className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3.5">
              <span className="rounded-md bg-info-soft p-2 text-secondary">
                <Mail size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">Email ingest — per entity</p>
                <p className="font-mono text-[11px] text-ink-soft">ap-uk@ · ap-de@ · ap-us@ ncons.app</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  10 entity inboxes · Claude reads attachments, routes to the owning entity · 78
                  invoices captured in May
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3.5">
              <span className="rounded-md bg-accent-soft p-2 text-accent">
                <Rss size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">EDI / e-invoicing</p>
                <p className="text-[11px] text-ink-faint">Peppol, EDIFACT, cXML · 5 suppliers connected</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-3.5">
              <span className="rounded-md bg-warn-soft p-2 text-warn">
                <Sparkles size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">Supplier portal</p>
                <p className="text-[11px] text-ink-faint">Suppliers submit + track status themselves — 9 active</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      {/* Review queue */}
      <Card>
        <CardHeader
          title="Review queue"
          subtitle="Captured invoices waiting for human confirmation — lowest confidence first"
        />
        <ul className="divide-y divide-line px-5 pb-3">
          {queue.map((inv) => {
            const s = supplierById(inv.supplierId)
            const minConf = Math.min(...inv.extraction.map((e) => e.confidence))
            const ent = entityById(inv.entityId)
            const verdict = ent
              ? complianceSummary(validateInvoice(inv, s, ent)).verdict
              : undefined
            return (
              <li key={inv.id} className="flex items-center gap-4 py-3">
                <span className="rounded-lg bg-canvas p-2 text-ink-faint">
                  <FileText size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    <span className="font-mono">{inv.number}</span> · {s.name}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {fmtMoney(inv.amount, inv.currency)} · received {fmtDateShort(inv.receivedDate)} · via {inv.source}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-[11px] text-ink-faint">lowest field</span>
                  <ConfidenceBar value={minConf} />
                  {verdict && (
                    <span
                      className={cls(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                        verdictPill[verdict].cls,
                      )}
                    >
                      {verdictPill[verdict].label}
                    </span>
                  )}
                </div>
                <Button variant="secondary" onClick={() => onOpen(inv)}>
                  Review
                </Button>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
