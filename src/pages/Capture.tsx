import { useState, useEffect } from 'react'
import { UploadCloud, Mail, Rss, FileText, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardHeader, Button, ConfidenceBar } from '../components/ui'
import { invoices, supplierById } from '../data'
import { fmtMoney, fmtDateShort, cls } from '../utils'
import type { Invoice } from '../types'

const steps = [
  'Reading document…',
  'Extracting header fields…',
  'Matching supplier record…',
  'Coding line items to GL…',
  'Running anomaly checks…',
  'Done — ready for review',
]

export function Capture({ onOpen }: { onOpen: (inv: Invoice) => void }) {
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!processing) return
    if (step >= steps.length - 1) return
    const t = setTimeout(() => setStep((s) => s + 1), 650)
    return () => clearTimeout(t)
  }, [processing, step])

  const queue = invoices.filter((i) => i.status === 'captured' || i.status === 'review')

  return (
    <div className="space-y-5 p-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Dropzone */}
        <Card className="lg:col-span-2">
          <CardHeader title="Capture invoices" subtitle="AI extracts fields, codes GL lines and runs fraud checks automatically" />
          <div className="p-5 pt-2">
            {!processing ? (
              <button
                onClick={() => {
                  setStep(0)
                  setProcessing(true)
                }}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-canvas px-6 py-14 transition-colors hover:border-secondary/50 hover:bg-info-soft/30"
              >
                <span className="rounded-full bg-info-soft p-3.5 text-secondary">
                  <UploadCloud size={26} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-ink">
                  Drop invoices here or <span className="text-secondary">browse files</span>
                </span>
                <span className="text-xs text-ink-faint">PDF, PNG, JPEG, XML (e-invoice) · up to 25MB each</span>
              </button>
            ) : (
              <div className="rounded-xl border border-line bg-canvas px-6 py-10">
                <div className="mx-auto max-w-sm">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-surface p-2.5 text-ink-faint shadow-sm">
                      <FileText size={20} aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-ink">invoice_brightline_jun.pdf</p>
                      <p className="text-[11px] text-ink-faint">248 KB</p>
                    </div>
                    {step >= steps.length - 1 ? (
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
                  {step >= steps.length - 1 && (
                    <div className="mt-5 flex gap-2">
                      <Button className="flex-1" onClick={() => setProcessing(false)}>
                        Review extraction
                      </Button>
                      <Button variant="secondary" onClick={() => setProcessing(false)}>
                        Capture another
                      </Button>
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
                <p className="text-[13px] font-medium text-ink">Email inbox</p>
                <p className="font-mono text-[11px] text-ink-soft">ap@yourco.aprio.app</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">214 invoices captured in May</p>
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
                    {fmtMoney(inv.amount)} · received {fmtDateShort(inv.receivedDate)} · via {inv.source}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-[11px] text-ink-faint">lowest field</span>
                  <ConfidenceBar value={minConf} />
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
