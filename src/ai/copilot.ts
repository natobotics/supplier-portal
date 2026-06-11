// AP Copilot — local demo engine.
//
// In production this routes to Claude via the API stub in ./anthropic.ts,
// passing the AP subledger as tool results. The local engine below answers
// the same questions deterministically so the demo works offline.

import {
  contracts,
  costCenterBudgets,
  invoices,
  portalUsers,
  purchaseOrders,
  supplierById,
  suppliers,
} from '../data'
import { fmtMoney, fmtCompact, fmtGBP, toGBP, daysOverdue, daysUntil, fmtDate } from '../utils'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

const open = () => invoices.filter((i) => i.status !== 'paid' && i.status !== 'rejected')

const answers: Array<{ match: RegExp; reply: () => string }> = [
  {
    match: /duplicate/i,
    reply: () => {
      const dups = invoices.filter((i) => i.anomalies.some((a) => a.type === 'duplicate'))
      if (!dups.length) return 'No duplicate candidates flagged right now.'
      return dups
        .map((i) => {
          const s = supplierById(i.supplierId)
          const a = i.anomalies.find((x) => x.type === 'duplicate')!
          return `**${i.number}** from ${s.name} (${fmtMoney(i.amount)}) looks like a duplicate.\n\n${a.message}\n\nRecommendation: keep ${i.number} on hold and reject it as a duplicate — the original was already paid. Ask the supplier to confirm before resubmitting anything for this period.`
        })
        .join('\n\n')
    },
  },
  {
    match: /due|this week|friday/i,
    reply: () => {
      const soon = open().filter((i) => {
        const d = daysOverdue(i.dueDate)
        return d >= -7 && d <= 0
      })
      const overdueList = open().filter((i) => daysOverdue(i.dueDate) > 0)
      const lines = soon.map(
        (i) => `- **${i.number}** · ${supplierById(i.supplierId).name} · ${fmtMoney(i.amount)} · due ${fmtDate(i.dueDate)}`,
      )
      let out = `**Due within 7 days** (${soon.length} invoices, ${fmtMoney(soon.reduce((s, i) => s + i.amount, 0))}):\n\n${lines.join('\n')}\n\nHeads-up: TB-0590 in that list is the suspected duplicate — keep it on hold rather than paying it.`
      if (overdueList.length) {
        const largest = overdueList.reduce((m, i) => (i.amount > m.amount ? i : m), overdueList[0])
        out += `\n\nAlso note: ${overdueList.length} invoice${overdueList.length === 1 ? '' : 's'} totalling ${fmtMoney(overdueList.reduce((s, i) => s + i.amount, 0))} ${overdueList.length === 1 ? 'is' : 'are'} already past due — ${largest.number} is the largest at ${fmtMoney(largest.amount)}.`
      }
      return out
    },
  },
  {
    match: /fraud|bank|risk/i,
    reply: () =>
      `Highest-risk item right now: **SIH-5521** from Stellar IT Hardware (${fmtMoney(23150)}).\n\nThe remit-to bank account changed from ••••4471 to ••••9923 three days before payment release, and the change request arrived by email rather than through the portal. That pattern matches business email compromise.\n\nRecommended controls:\n1. Freeze the payment (done — 72h hold active)\n2. Call the supplier on the number from the original onboarding record, not the email\n3. Require re-verification through the supplier portal with 2FA`,
  },
  {
    match: /discount|saving/i,
    reply: () => {
      const d = open().filter((i) => i.discount && daysOverdue(i.discount.deadline) <= 0)
      const total = d.reduce((s, i) => s + (i.discount?.amount ?? 0), 0)
      return `You can capture **${fmtMoney(total)}** in early-pay discounts:\n\n${d
        .map(
          (i) =>
            `- **${i.number}** (${supplierById(i.supplierId).name}): save ${fmtMoney(i.discount!.amount)} by paying before ${fmtDate(i.discount!.deadline)} — ${i.discount!.terms}`,
        )
        .join('\n')}\n\nBoth windows close **today, Jun 11** — the scheduled BAT-061226 run goes out tomorrow and would miss them. Release a same-day ACH today or the ${fmtMoney(total)} is gone.`
    },
  },
  {
    match: /aging|overdue|late/i,
    reply: () => {
      const o = open().filter((i) => daysOverdue(i.dueDate) > 0)
      return `**${o.length} invoices are past due**, totalling ${fmtMoney(o.reduce((s, i) => s + i.amount, 0))}:\n\n${o
        .map(
          (i) =>
            `- **${i.number}** · ${supplierById(i.supplierId).name} · ${fmtMoney(i.amount)} · ${daysOverdue(i.dueDate)} days late`,
        )
        .join('\n')}\n\nRoot cause: PSS-1107 (PrimeStaff Solutions) came in without a PO, so Finance is holding it until HR raises a retroactive PO. Chase HR, not the supplier.`
    },
  },
  {
    match: /\bpo\b|purchase order|work order|balance|remaining/i,
    reply: () => {
      const openPOs = purchaseOrders.filter(
        (p) => p.status === 'issued' || p.status === 'partially_billed',
      )
      const lines = openPOs.map((p) => {
        const s = supplierById(p.supplierId)
        const remaining = p.notToExceed - p.billedToDate
        const pct = Math.round((p.billedToDate / p.notToExceed) * 100)
        return `- **${p.number}** · ${s.name} · billed ${fmtMoney(p.billedToDate)} of ${fmtMoney(p.notToExceed)} (${pct}%) · ${fmtMoney(remaining)} remaining`
      })
      return `**Open PO balances:**\n\n${lines.join('\n')}\n\nWatch items: **PO-2026-0007** is 57% drawn with two more invoices in flight (RP-2026-014 captured, RP-2026-013 in exception) — at this burn rate it exhausts well before its Sep 30 end date. **PO-2026-0011** is tight too: the pending EM-2026-09 (${fmtMoney(9460)}) would leave just ${fmtMoney(33000 - 14300 - 9460)} for three more months of work.`
    },
  },
  {
    match: /dpo|cash/i,
    reply: () => {
      const ytd = suppliers.reduce((s, x) => s + x.ytdSpend, 0)
      return `**DPO is 28.4 days**, down from 31.2 last quarter.\n\nDriver: the freelance engineers all bill on Net 15, and their share of invoice volume grew this quarter — fast turnaround on those pulls the blended figure down. Total YTD spend is ${fmtCompact(ytd)} across ${suppliers.length} suppliers, so a handful of early payments moves the needle.\n\nIf cash gets tight, slow the non-discounted Net 30 payments (Helix, Stellar) back toward full terms — that recovers ~2 days of DPO without giving up the 2/10 discounts on TalentBridge and SecureNet.`
    },
  },
  {
    match: /budget|burn|cost cent/i,
    reply: () => {
      const rows = costCenterBudgets.map((b) => {
        const internal = b.costCenter.startsWith('CC-600')
        const pos = purchaseOrders.filter((p) => p.costCenter === b.costCenter)
        const committed = internal
          ? invoices
              .filter((i) => i.costType === 'internal')
              .reduce((s, i) => s + toGBP(i.amount, i.currency), 0)
          : pos.reduce((s, p) => s + toGBP(p.notToExceed, supplierById(p.supplierId).currency), 0)
        const actual = internal
          ? committed
          : pos.reduce((s, p) => s + toGBP(p.billedToDate, supplierById(p.supplierId).currency), 0)
        const burn = Math.round((committed / b.fyBudgetGBP) * 100)
        return { b, committed, actual, burn, internal }
      })
      const lines = rows.map(({ b, committed, actual, burn, internal }) =>
        internal
          ? `- **${b.costCenter}** — budget ${fmtGBP(b.fyBudgetGBP)} · internal spend ${fmtGBP(actual)} (${burn}% burn)`
          : `- **${b.costCenter}** — budget ${fmtGBP(b.fyBudgetGBP)} · committed ${fmtGBP(committed)} · billed ${fmtGBP(actual)} (${burn}% burn)`,
      )
      const warnings = rows
        .filter((r) => r.burn >= 85)
        .map(({ b, committed, burn }) => {
          const headroom = b.fyBudgetGBP - committed
          return headroom >= 0
            ? `Warning: **${b.costCenter}** is at ${burn}% of its FY budget — only ${fmtGBP(headroom)} of headroom left (owner: ${b.owner}).`
            : `Warning: **${b.costCenter}** is over its FY budget by ${fmtGBP(-headroom)} at ${burn}% burn (owner: ${b.owner}).`
        })
      return `**Cost-centre burn vs FY budget** (group figures in GBP):\n\n${lines.join('\n')}\n\n${
        warnings.length ? `${warnings.join('\n')}\n\n` : ''
      }Recommendation: freeze new commitments on the flagged centres and have the owners re-forecast H2 with Finance before the next PO is raised.`
    },
  },
  {
    match: /contract|rate card|expir/i,
    reply: () => {
      const expiring = contracts.filter(
        (c) => c.expiry && daysUntil(c.expiry) >= 0 && daysUntil(c.expiry) <= 60,
      )
      const missing = contracts.filter((c) => c.status === 'missing')
      const inv = invoices.find((i) => i.number === 'RP-2026-013')!
      const card = contracts.find(
        (c) => c.supplierId === inv.supplierId && c.type === 'Rate card' && c.rateCard,
      )!
      const billed = inv.timesheet!.rate
      const contracted = card.rateCard![0].rate
      const pct = (((billed - contracted) / contracted) * 100).toFixed(1)
      const expLines = expiring.map(
        (c) =>
          `- **${supplierById(c.supplierId).name}** — ${c.title} expires ${fmtDate(c.expiry!)} (${daysUntil(c.expiry!)} days)${c.note ? ` — ${c.note.split(' — ')[0].toLowerCase()}` : ''}`,
      )
      const missLines = missing.map(
        (c) =>
          `- **${supplierById(c.supplierId).name}** — ${c.type} missing${c.note ? `: ${c.note}` : ''}`,
      )
      return `**Expiring within 60 days:**\n\n${expLines.join('\n')}\n\n**Missing documents:**\n\n${missLines.join(
        '\n',
      )}\n\n**Rate guard:** ${inv.number} billed ${fmtMoney(billed, inv.currency)}/hr against the contracted ${fmtMoney(contracted, card.rateCard![0].currency)}/hr on the ${supplierById(inv.supplierId).name} rate card (+${pct}%) — the supplier cites out-of-hours work, but the rate card has no uplift clause.\n\nRecommendation: keep ${inv.number} on hold, then either renegotiate the line or amend the rate card to add an uplift clause before paying.`
    },
  },
  {
    match: /delegat|user|who approv/i,
    reply: () => {
      const scope = (ids: string[] | 'all') =>
        ids === 'all'
          ? 'all entities'
          : ids.length === 1
            ? ids[0].split('-')[1].toUpperCase()
            : `${ids.length} entities (${ids.map((e) => e.split('-')[1].toUpperCase()).join(', ')})`
      const delegating = portalUsers.filter((u) => u.delegation && u.status === 'active')
      const heads = portalUsers.filter((u) => u.role === 'Finance Head')
      const invited = portalUsers.filter((u) => u.status === 'invited')
      const delLines = delegating.map(
        (u) =>
          `- **${u.name}** (${u.role}) → ${u.delegation!.to} until ${fmtDate(u.delegation!.until)} — anything at the ${u.role} approval step routes to ${u.delegation!.to}'s queue meanwhile`,
      )
      const headLines = heads.map(
        (u) =>
          `- **${u.name}** — ${scope(u.entityIds)}${u.status === 'invited' ? ' · invited, not active yet' : ''}`,
      )
      const inviteLines = invited.map(
        (u) =>
          `- **${u.name}** — ${u.role === 'Auditor' ? 'read-only auditor access' : u.role} (${scope(u.entityIds)})`,
      )
      return `**Active delegation:**\n\n${delLines.join('\n')}\n\n**Finance Head coverage:**\n\n${headLines.join(
        '\n',
      )}\n\n**Pending invites:**\n\n${inviteLines.join(
        '\n',
      )}\n\nNote: HR-routed invoices land with Marta Kowalska until the delegation lapses, and India has no active Finance Head until Anita Rao accepts her invite — chase both before month-end approvals pile up.`
    },
  },
  {
    match: /supplier|spend/i,
    reply: () => {
      const top = [...suppliers].sort((a, b) => b.ytdSpend - a.ytdSpend).slice(0, 5)
      const total = suppliers.reduce((s, x) => s + x.ytdSpend, 0)
      const share = Math.round((top[0].ytdSpend / total) * 100)
      return `**Top suppliers by YTD spend:**\n\n${top
        .map((s, i) => `${i + 1}. ${s.name} — ${fmtMoney(s.ytdSpend)} (${s.category})`)
        .join('\n')}\n\nConcentration note: ${top[0].name} is ~${share}% of YTD spend — three contract recruiters on PO-2026-0004 plus placement fees. Worth a rate benchmark before extending the Q3 ramp.`
    },
  },
]

// Copilot actions — approve/hold from chat with an explicit confirmation round-trip.
// In production these call the same mutation API as the UI buttons and are
// audit-logged under the chatting user's identity.
const actionRules: Array<{ match: RegExp; reply: (m: RegExpMatchArray) => string }> = [
  {
    match: /^confirm\s+approve\s+([A-Z]{1,4}[\w/-]*-[\w-]+)/i,
    reply: (m) => {
      const inv = invoices.find((i) => i.number.toLowerCase() === m[1].toLowerCase())
      if (!inv) return `I can't find invoice **${m[1]}**. Check the number and try again.`
      const step = inv.approvals.findIndex((a) => a.status === 'pending') + 1
      return `Done — **${inv.number}** approved at step ${step} of 4 as Sarah Chen.\n\nRecorded in the audit log (kind: approval, source: copilot). The invoice moves to ${
        step >= 4 ? 'the next payment run' : `step ${step + 1} — ${inv.approvals[step]?.approver ?? 'next approver'}`
      }.`
    },
  },
  {
    match: /^(?:approve|hold)\s+([A-Z]{1,4}[\w/-]*-[\w-]+)/i,
    reply: (m) => {
      const inv = invoices.find((i) => i.number.toLowerCase() === m[1].toLowerCase())
      if (!inv) return `I can't find invoice **${m[1]}**. Check the number and try again.`
      const s = supplierById(inv.supplierId)
      const pending = inv.approvals.find((a) => a.status === 'pending')
      if (!pending)
        return `**${inv.number}** has no pending approval step — current status: ${inv.status}.`
      const flags = inv.anomalies.length
        ? `\n\nHeads up: this invoice carries ${inv.anomalies.length} anomaly flag(s) — ${inv.anomalies
            .map((a) => a.type.replace('_', ' '))
            .join(', ')}.`
        : ''
      return `**${inv.number}** — ${s.name}, ${fmtMoney(inv.amount, inv.currency)}, waiting on ${pending.approver} (${pending.role}).${flags}\n\nTo execute, reply: **confirm approve ${inv.number}**\n\nActions from chat are recorded against your user in the audit log.`
    },
  },
]

export function answer(question: string): string {
  for (const a of actionRules) {
    const m = question.trim().match(a.match)
    if (m) return a.reply(m)
  }
  for (const a of answers) if (a.match.test(question)) return a.reply()
  return `I can answer questions about your AP data — try:\n\n- "Any fraud risks right now?"\n- "What's due this week?"\n- "Show me possible duplicates"\n- "How much is left on each PO?"\n- "Any budgets close to the limit?"\n- "Which contracts are expiring soon?"\n- "Who approves HR invoices this week?"\n- "What discounts can we capture?"`
}

export const suggestedPrompts = [
  'Any fraud risks right now?',
  "What's due this week?",
  'Show me possible duplicates',
  'Any budgets close to the limit?',
]
