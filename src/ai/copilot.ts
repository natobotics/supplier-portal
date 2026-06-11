// AP Copilot — local demo engine.
//
// In production this routes to Claude via the API stub in ./anthropic.ts,
// passing the AP subledger as tool results. The local engine below answers
// the same questions deterministically so the demo works offline.

import { invoices, supplierById, suppliers } from '../data'
import { fmtMoney, daysOverdue, fmtDate } from '../utils'

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
          return `**${i.number}** from ${s.name} (${fmtMoney(i.amount)}) looks like a duplicate.\n\n${a.message}\n\nRecommendation: hold this invoice and request a statement from the supplier before approving.`
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
      return `**Due within 7 days** (${soon.length} invoices, ${fmtMoney(soon.reduce((s, i) => s + i.amount, 0))}):\n\n${lines.join('\n')}\n\nAlso note: ${overdueList.length} invoices totalling ${fmtMoney(overdueList.reduce((s, i) => s + i.amount, 0))} are already past due — QC-88317 is the largest at ${fmtMoney(88600)}.`
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
        .join('\n')}\n\nBoth exceed your 12% annualized hurdle rate, so paying early beats holding cash. Add them to the Jun 12 ACH run to capture both.`
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
        .join('\n')}\n\nRoot cause on the two largest: QC-88317 is blocked on a receiving report (qty variance), BLM-30684 on a contract price escalation review. Both need action from operations, not AP.`
    },
  },
  {
    match: /dpo|cash/i,
    reply: () =>
      `**DPO is 34.2 days**, down from 36.8 last quarter.\n\nDriver: early-pay discount captures accelerated ~$240k of payments by an average of 18 days. That traded 2.6 days of DPO for ${fmtMoney(4146)} in discounts YTD — annualized return ≈ 36%, well above your cost of capital.\n\nIf cash gets tight, skipping non-discounted early payments would push DPO back to ~37 without losing any savings.`,
  },
  {
    match: /supplier|spend/i,
    reply: () => {
      const top = [...suppliers].sort((a, b) => b.ytdSpend - a.ytdSpend).slice(0, 5)
      return `**Top suppliers by YTD spend:**\n\n${top
        .map((s, i) => `${i + 1}. ${s.name} — ${fmtMoney(s.ytdSpend)} (${s.category})`)
        .join('\n')}\n\nConcentration note: Brightline is 30% of YTD spend. Their last two invoices show price escalations — worth a contract review before Q3 volumes.`
    },
  },
]

export function answer(question: string): string {
  for (const a of answers) if (a.match.test(question)) return a.reply()
  return `I can answer questions about your AP data — try:\n\n- "Show me possible duplicates"\n- "What's due this week?"\n- "Any fraud risks?"\n- "What discounts can we capture?"\n- "Why did DPO change?"\n- "Top suppliers by spend"`
}

export const suggestedPrompts = [
  'Any fraud risks right now?',
  "What's due this week?",
  'Show me possible duplicates',
  'What discounts can we capture?',
]
