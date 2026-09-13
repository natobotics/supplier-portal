import { useEffect, useMemo, useRef, useState } from 'react'
import { Printer, Plus, Trash2, FileSignature, CheckCircle2 } from 'lucide-react'
import { Card, Button } from '../components/ui'
import { useEntities } from '../lib/api'
import {
  ENTITY_LEGAL,
  PAYMENT_CLAUSES,
  IP_CLAUSE,
  GOVERNING_CLAUSE,
  SERVICE_PRESETS,
  makeReference,
  type ScopeSection,
} from '../lib/templates'
import { fmtMoney, fmtDate, cls } from '../utils'

type DocType = 'sow' | 'po'

interface Milestone {
  activity: string
  completion: string
  acceptance: string
  amount: number
}

const inputCls =
  'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none'

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

export function DocGen() {
  const entities = useEntities()
  const preset0 = SERVICE_PRESETS[0]

  const [docType, setDocType] = useState<DocType>('sow')
  const [entityId, setEntityId] = useState('ent-uk')
  const [seq] = useState(1)
  const [counterparty, setCounterparty] = useState('')
  const [counterpartyAddr, setCounterpartyAddr] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currency, setCurrency] = useState('GBP')
  const [terms, setTerms] = useState('Net 30')
  const [law, setLaw] = useState('United Kingdom')
  const [masterRef, setMasterRef] = useState('Sub-Contracting Agreement')
  const [masterDate, setMasterDate] = useState('')

  // SOW content
  const [presetId, setPresetId] = useState(preset0.id)
  const [overview, setOverview] = useState(preset0.overview)
  const [scope, setScope] = useState<ScopeSection[]>(preset0.scopeSections)
  const [deliverables, setDeliverables] = useState(preset0.deliverables.join('\n'))
  const [dependencies, setDependencies] = useState(preset0.dependencies.join('\n'))
  const [assumptions, setAssumptions] = useState(preset0.assumptions.join('\n'))
  const [payMode, setPayMode] = useState('Fixed price')

  // PO extras
  const [notice, setNotice] = useState('4 weeks')
  const [invoiceCycle, setInvoiceCycle] = useState('As per the milestones')
  const [special, setSpecial] = useState('Payment will be released on milestone acceptance/sign-off.')

  const [milestones, setMilestones] = useState<Milestone[]>([
    { activity: '', completion: '', acceptance: 'Sign-off', amount: 0 },
  ])

  const [ourName, setOurName] = useState('Kiruban Swayamprakasam')
  const [ourTitle, setOurTitle] = useState('Managing Director')
  const [theirName, setTheirName] = useState('')
  const [theirTitle, setTheirTitle] = useState('')
  const [savedBanner, setSavedBanner] = useState(false)

  // Live entities carry database UUIDs — fall back to the entity record itself
  // when the static legal map has no entry, and keep the selection valid.
  useEffect(() => {
    if (entities.length > 0 && !entities.some((e) => e.id === entityId)) {
      const uk = entities.find((e) => e.country === 'United Kingdom')
      setEntityId((uk ?? entities[0]).id)
    }
  }, [entities, entityId])
  const entObj = entities.find((e) => e.id === entityId)
  const legal = ENTITY_LEGAL[entityId] ?? {
    legalName: entObj?.name.replace(/^NCons\s/, 'N Consulting ') ?? 'N Consulting Ltd',
    address: entObj?.country ?? '',
  }
  const reference = useMemo(
    () => makeReference(docType === 'sow' ? 'SOW' : 'PO', entityId, seq),
    [docType, entityId, seq],
  )
  const total = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const clause = PAYMENT_CLAUSES[law] ?? PAYMENT_CLAUSES.default
  const previewRef = useRef<HTMLDivElement>(null)

  const applyPreset = (id: string) => {
    setPresetId(id)
    const p = SERVICE_PRESETS.find((x) => x.id === id)
    if (!p) return
    setOverview(p.overview)
    setScope(p.scopeSections)
    setDeliverables(p.deliverables.join('\n'))
    setDependencies(p.dependencies.join('\n'))
    setAssumptions(p.assumptions.join('\n'))
  }

  const updateScope = (i: number, patch: Partial<{ heading: string; bullets: string }>) =>
    setScope((ss) =>
      ss.map((s, j) =>
        j === i
          ? {
              heading: patch.heading ?? s.heading,
              bullets: patch.bullets !== undefined ? lines(patch.bullets) : s.bullets,
            }
          : s,
      ),
    )

  const updateMilestone = (i: number, patch: Partial<Milestone>) =>
    setMilestones((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  const printDoc = () => {
    if (!previewRef.current) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>${reference}</title><style>
      body{font-family:Inter,system-ui,sans-serif;color:#0f172a;font-size:13px;line-height:1.6;padding:40px;max-width:800px;margin:0 auto}
      table{border-collapse:collapse;width:100%;margin:8px 0}
      td,th{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;font-size:12px;vertical-align:top}
      h1{font-size:17px;text-align:center;margin:18px 0}h2{font-size:14px;margin:16px 0 6px}h3{font-size:13px;margin:12px 0 4px}
      ul{margin:4px 0;padding-left:20px}li{margin:2px 0}p{margin:6px 0}
      .brandbar{display:flex;height:4px}.brandbar div{flex:1}
      .sig{border-bottom:1px solid #0f172a;height:28px;margin:18px 0 4px}
    </style></head><body>${previewRef.current.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const fmtD = (iso: string) => (iso ? fmtDate(iso) : '____________')
  const cpty = counterparty || '[Client name]'

  return (
    <div className="flex h-full flex-col gap-5 p-6 xl:flex-row">
      {/* ---- Form ---- */}
      <div className="shrink-0 space-y-4 overflow-y-auto xl:w-[440px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1" role="tablist">
            {(
              [
                ['sow', 'Statement of Work'],
                ['po', 'Purchase Order'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={docType === id}
                onClick={() => setDocType(id)}
                className={cls(
                  'cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                  docType === id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-canvas',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={printDoc}>
            <Printer size={14} aria-hidden="true" /> Print / PDF
          </Button>
        </div>

        {savedBanner && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-2.5 text-[13px] font-medium text-accent" role="status">
            <CheckCircle2 size={14} aria-hidden="true" /> Saved to the register (demo)
          </div>
        )}

        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">Parties & engagement</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issuing entity">
              <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className={cls(inputCls, 'cursor-pointer')}>
                {entities.filter((e) => e.active).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Reference">
              <input value={reference} readOnly className={cls(inputCls, 'font-mono text-xs')} />
            </Field>
          </div>
          <Field label="Client / counterparty">
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Infosys Automotive and Mobility GmbH & Co. KG" className={inputCls} />
          </Field>
          <Field label="Counterparty address">
            <textarea value={counterpartyAddr} onChange={(e) => setCounterpartyAddr(e.target.value)} rows={2} placeholder="Registered address" className={inputCls} />
          </Field>
          <Field label="Engagement / project title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Network Solution & Design services" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location of services">
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Multiple locations — allocated" className={inputCls} />
            </Field>
            <Field label="Currency">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={cls(inputCls, 'cursor-pointer')}>
                {['GBP', 'EUR', 'USD', 'PLN', 'AED', 'INR', 'SGD', 'SEK'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Start date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="End date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Payment terms">
              <select value={terms} onChange={(e) => setTerms(e.target.value)} className={cls(inputCls, 'cursor-pointer')}>
                {['Net 30', 'Net 45', 'Net 60', 'Due on receipt'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Governing law / interest clause">
              <select value={law} onChange={(e) => setLaw(e.target.value)} className={cls(inputCls, 'cursor-pointer')}>
                {['United Kingdom', 'Germany', 'Other'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          {docType === 'sow' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Master agreement">
                <input value={masterRef} onChange={(e) => setMasterRef(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Master agreement date">
                <input type="date" value={masterDate} onChange={(e) => setMasterDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}
        </Card>

        {docType === 'sow' && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">Services & scope</p>
              <select value={presetId} onChange={(e) => applyPreset(e.target.value)} aria-label="Service preset" className="cursor-pointer rounded-lg border border-line bg-canvas px-2 py-1 text-xs text-ink">
                {SERVICE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <Field label="Service overview">
              <textarea value={overview} onChange={(e) => setOverview(e.target.value)} rows={3} className={inputCls} />
            </Field>
            {scope.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-line bg-canvas p-3">
                <div className="flex items-center gap-2">
                  <input value={s.heading} onChange={(e) => updateScope(i, { heading: e.target.value })} aria-label={`Scope section ${i + 1} heading`} className={cls(inputCls, 'bg-surface font-medium')} />
                  <button onClick={() => setScope((ss) => ss.filter((_, j) => j !== i))} aria-label="Remove section" className="cursor-pointer rounded-lg p-2 text-ink-faint hover:bg-surface hover:text-danger">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
                <textarea
                  value={s.bullets.join('\n')}
                  onChange={(e) => updateScope(i, { bullets: e.target.value })}
                  rows={Math.min(6, Math.max(3, s.bullets.length))}
                  aria-label={`Scope section ${i + 1} items, one per line`}
                  className={cls(inputCls, 'bg-surface text-xs')}
                />
              </div>
            ))}
            <Button variant="secondary" onClick={() => setScope((ss) => [...ss, { heading: 'New section', bullets: [] }])}>
              <Plus size={14} aria-hidden="true" /> Add scope section
            </Button>
            <Field label="Deliverables (one per line)">
              <textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} className={inputCls} />
            </Field>
            <Field label="Dependencies (one per line)">
              <textarea value={dependencies} onChange={(e) => setDependencies(e.target.value)} rows={3} className={inputCls} />
            </Field>
            <Field label="Assumptions (one per line)">
              <textarea value={assumptions} onChange={(e) => setAssumptions(e.target.value)} rows={3} className={inputCls} />
            </Field>
            <Field label="Payment mode">
              <div className="flex gap-1.5">
                {['Fixed price', 'Time & materials', 'Milestones'].map((m) => (
                  <button key={m} onClick={() => setPayMode(m)} className={cls('cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors', payMode === m ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink-soft hover:bg-canvas')}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
        )}

        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Delivery & payment milestones · total{' '}
            <span className="tabular font-mono text-ink">{fmtMoney(total, currency)}</span>
          </p>
          {milestones.map((m, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-line bg-canvas p-3">
              <div className="flex items-center gap-2">
                <input value={m.activity} onChange={(e) => updateMilestone(i, { activity: e.target.value })} placeholder={`Milestone ${i + 1} activity / deliverable`} aria-label={`Milestone ${i + 1} activity`} className={cls(inputCls, 'bg-surface')} />
                <button onClick={() => setMilestones((ms) => ms.filter((_, j) => j !== i))} aria-label="Remove milestone" className="cursor-pointer rounded-lg p-2 text-ink-faint hover:bg-surface hover:text-danger">
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
              <div className={cls('grid gap-2', docType === 'po' ? 'grid-cols-3' : 'grid-cols-2')}>
                <input type="date" value={m.completion} onChange={(e) => updateMilestone(i, { completion: e.target.value })} aria-label={`Milestone ${i + 1} completion date`} className={cls(inputCls, 'bg-surface text-xs')} />
                {docType === 'po' && (
                  <input value={m.acceptance} onChange={(e) => updateMilestone(i, { acceptance: e.target.value })} placeholder="Acceptance criteria" aria-label={`Milestone ${i + 1} acceptance criteria`} className={cls(inputCls, 'bg-surface text-xs')} />
                )}
                <input type="number" value={m.amount || ''} onChange={(e) => updateMilestone(i, { amount: Number(e.target.value) })} placeholder="Amount" aria-label={`Milestone ${i + 1} amount`} className={cls(inputCls, 'bg-surface text-xs')} />
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setMilestones((ms) => [...ms, { activity: '', completion: '', acceptance: 'Sign-off', amount: 0 }])}>
            <Plus size={14} aria-hidden="true" /> Add milestone
          </Button>
        </Card>

        {docType === 'po' && (
          <Card className="space-y-3 p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">PO terms</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Notice period">
                <input value={notice} onChange={(e) => setNotice(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Invoice cycle">
                <input value={invoiceCycle} onChange={(e) => setInvoiceCycle(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Special conditions">
              <textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={2} className={inputCls} />
            </Field>
            <Button variant="secondary" onClick={() => { setSavedBanner(true); setTimeout(() => setSavedBanner(false), 4000) }}>
              <FileSignature size={14} aria-hidden="true" /> Save to Purchase orders
            </Button>
          </Card>
        )}

        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">Signatories</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Our signatory">
              <input value={ourName} onChange={(e) => setOurName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Title">
              <input value={ourTitle} onChange={(e) => setOurTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Counterparty signatory">
              <input value={theirName} onChange={(e) => setTheirName(e.target.value)} placeholder="Name" className={inputCls} />
            </Field>
            <Field label="Title">
              <input value={theirTitle} onChange={(e) => setTheirTitle(e.target.value)} placeholder="Title" className={inputCls} />
            </Field>
          </div>
        </Card>
      </div>

      {/* ---- Live preview ---- */}
      <Card className="min-h-0 flex-1 overflow-y-auto bg-canvas p-6">
        <div ref={previewRef} className="mx-auto max-w-3xl rounded-sm bg-white p-8 text-[13px] leading-relaxed text-[#0f172a] shadow-sm">
          <div className="brandbar mb-4 flex h-1">
            {['#5E68AA', '#C7BC30', '#C61A1C', '#059948'].map((c) => (
              <div key={c} style={{ background: c, flex: 1 }} />
            ))}
          </div>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.08em]">NCONS</p>
              <p className="text-xs text-[#475569]">{legal.legalName}</p>
              <p className="text-xs text-[#475569]">{legal.address}</p>
            </div>
            <p className="font-mono text-xs text-[#475569]">{reference}</p>
          </div>

          {docType === 'sow' ? (
            <>
              <h1 className="my-4 text-center text-[16px] font-bold uppercase">
                Work Order for — {title || '[Engagement title]'}
              </h1>
              <p>
                This Work Order is made on the {fmtDate(new Date().toISOString().slice(0, 10))} between:{' '}
                <strong>{legal.legalName}</strong>, {legal.address} and <strong>{cpty}</strong>
                {counterpartyAddr ? `, ${counterpartyAddr.replace(/\n/g, ', ')}` : ''}.
              </p>
              <p>{GOVERNING_CLAUSE(masterRef, masterDate ? fmtDate(masterDate) : '____________')}</p>
              <p>
                NOW THEREFORE IT IS HEREBY AGREED as follows: The Service Provider agrees to provide
                the Services as set out in this Work Order.
              </p>

              <h2 className="mt-5 text-sm font-bold">I. Services to be provided</h2>
              <h3 className="mt-2 font-semibold">Service overview</h3>
              <p>{overview}</p>
              <h3 className="mt-3 font-semibold">Scope of services</h3>
              {scope.map((s, i) => (
                <div key={i}>
                  <p className="mt-2 font-medium">
                    2.{i + 1} {s.heading}
                  </p>
                  <ul className="list-disc pl-5">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <h3 className="mt-3 font-semibold">Location of services</h3>
              <p>{location || '[Location]'}</p>
              <h3 className="mt-3 font-semibold">Deliverables</h3>
              <ul className="list-disc pl-5">{lines(deliverables).map((d) => <li key={d}>{d}</li>)}</ul>
              <h3 className="mt-3 font-semibold">Service Provider intellectual property</h3>
              <p>{IP_CLAUSE}</p>

              <h2 className="mt-5 text-sm font-bold">II. Dependencies & assumptions</h2>
              <h3 className="mt-2 font-semibold">Dependencies</h3>
              <ul className="list-disc pl-5">{lines(dependencies).map((d) => <li key={d}>{d}</li>)}</ul>
              <h3 className="mt-3 font-semibold">Assumptions</h3>
              <ul className="list-disc pl-5">{lines(assumptions).map((a) => <li key={a}>{a}</li>)}</ul>

              <h2 className="mt-5 text-sm font-bold">III. Payment</h2>
              <p>
                Mode of payment: <strong>{payMode}</strong>. The total cost for {title || 'the Services'} for the
                period {fmtD(startDate)} to {fmtD(endDate)} is <strong>{fmtMoney(total, currency)}</strong>.
              </p>
              <h3 className="mt-3 font-semibold">Delivery and payment milestones</h3>
              <table className="my-2 w-full border-collapse">
                <thead>
                  <tr>
                    {['#', 'Activity / deliverable', 'Completion date', 'Amount'].map((h) => (
                      <th key={h} className="border border-[#cbd5e1] px-2 py-1 text-left text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m, i) => (
                    <tr key={i}>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{i + 1}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{m.activity || '—'}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{m.completion ? fmtDate(m.completion) : '—'}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono text-xs">{fmtMoney(m.amount || 0, currency)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="border border-[#cbd5e1] px-2 py-1 text-xs font-semibold">TOTAL</td>
                    <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono text-xs font-semibold">{fmtMoney(total, currency)}</td>
                  </tr>
                </tbody>
              </table>
              <h3 className="mt-3 font-semibold">Payment terms</h3>
              <p>
                The Company shall pay the Supplier's invoices within a {terms.toLowerCase().replace('net ', 'net ')}-day
                period from receipt of the supplier invoice.
              </p>
              <p>{clause}</p>

              <h2 className="mt-5 text-sm font-bold">IV. Contacts</h2>
              <p>
                Service Provider representative: {ourName} · kiruban.swayam@n-cons.co.uk
              </p>

              <h2 className="mt-5 text-sm font-bold">V. Term</h2>
              <p>
                The Services under this Work Order shall commence on {fmtD(startDate)} and be completed/expire
                on {fmtD(endDate)} unless terminated as provided in the {masterRef}.
              </p>

              <h2 className="mt-5 text-sm font-bold">Execution</h2>
              <div className="mt-3 grid grid-cols-2 gap-8">
                <div>
                  <p className="font-medium">{cpty}</p>
                  <div className="sig mt-5 h-7 border-b border-[#0f172a]" />
                  <p className="text-xs">Authorized signatory</p>
                  <p className="text-xs">Name: {theirName || '____________'}</p>
                  <p className="text-xs">Title: {theirTitle || '____________'}</p>
                </div>
                <div>
                  <p className="font-medium">{legal.legalName}</p>
                  <div className="sig mt-5 h-7 border-b border-[#0f172a]" />
                  <p className="text-xs">Authorized signatory</p>
                  <p className="text-xs">Name: {ourName}</p>
                  <p className="text-xs">Title: {ourTitle}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="my-4 text-center text-[16px] font-bold uppercase">Purchase Order</h1>
              <p className="text-center text-xs font-semibold tracking-wide text-[#475569]">Contract Schedule — I</p>
              <table className="my-4 w-full border-collapse">
                <tbody>
                  {(
                    [
                      ['Client', cpty],
                      ['Supplier', legal.legalName],
                      ['Project', title || '[Project]'],
                      ['Location', location || '[Location]'],
                      ['Contract start date', fmtD(startDate)],
                      ['Contract end date', fmtD(endDate)],
                      ['Rate', 'As per milestones'],
                    ] as const
                  ).map(([k, v]) => (
                    <tr key={k}>
                      <td className="w-44 border border-[#cbd5e1] px-2 py-1 text-xs font-semibold">{k}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="mt-3 font-semibold">Milestones</h3>
              <table className="my-2 w-full border-collapse">
                <thead>
                  <tr>
                    {['#', 'Deliverable', 'Completion', 'Acceptance criteria', `Amount (${currency})`].map((h) => (
                      <th key={h} className="border border-[#cbd5e1] px-2 py-1 text-left text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m, i) => (
                    <tr key={i}>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{i + 1}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{m.activity || '—'}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{m.completion ? fmtDate(m.completion) : '—'}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{m.acceptance || '—'}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono text-xs">{fmtMoney(m.amount || 0, currency)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="border border-[#cbd5e1] px-2 py-1 text-xs font-semibold">TOTAL CONTRACT VALUE</td>
                    <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono text-xs font-semibold">{fmtMoney(total, currency)}</td>
                  </tr>
                </tbody>
              </table>
              <table className="my-4 w-full border-collapse">
                <tbody>
                  {(
                    [
                      ['Notice period', notice],
                      ['Invoice cycle', invoiceCycle],
                      ['Payment terms', terms],
                      ['Special conditions', special],
                    ] as const
                  ).map(([k, v]) => (
                    <tr key={k}>
                      <td className="w-44 border border-[#cbd5e1] px-2 py-1 text-xs font-semibold">{k}</td>
                      <td className="border border-[#cbd5e1] px-2 py-1 text-xs">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs">{clause}</p>
              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <p className="font-medium">Supplier: {legal.legalName}</p>
                  <div className="sig mt-5 h-7 border-b border-[#0f172a]" />
                  <p className="text-xs">Signed</p>
                  <p className="text-xs">Name: {ourName}</p>
                  <p className="text-xs">Position held: {ourTitle}</p>
                </div>
                <div>
                  <p className="font-medium">Company: {cpty}</p>
                  <div className="sig mt-5 h-7 border-b border-[#0f172a]" />
                  <p className="text-xs">Signed</p>
                  <p className="text-xs">Name: {theirName || '____________'}</p>
                  <p className="text-xs">Position held: {theirTitle || '____________'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
