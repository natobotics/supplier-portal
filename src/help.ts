import type { Page } from './types'

export interface PageHelp {
  what: string
  points: string[]
}

// Contextual help copy for every page, surfaced via the Topbar help popover.
export const PAGE_HELP: Record<Page, PageHelp> = {
  dashboard: {
    what: 'Your AP control tower.',
    points: [
      'KPIs and charts compute live from the invoice data',
      'AI insights flag duplicates, rate violations and expiring discounts',
      'Switch entity in the top bar — group view consolidates to GBP',
    ],
  },
  invoices: {
    what: 'Every supplier invoice, end to end.',
    points: [
      'Tabs filter by lifecycle stage — exceptions need attention first',
      'Warning triangles mark AI anomaly flags; click any row for full detail',
      'Credit notes live in their own tab and net against totals',
    ],
  },
  capture: {
    what: 'AI-powered invoice intake.',
    points: [
      'Drop a PDF or image — Claude reads it, codes it and runs country compliance checks',
      'Fields under 90% confidence queue for human review',
      'Email, EDI and the supplier portal feed this queue automatically',
    ],
  },
  submit: {
    what: 'Submit an invoice as a supplier.',
    points: [
      'Supplier-side flow: pick who you are, bill against an open PO',
      'The rate is locked from the PO — overruns are flagged before submission',
      'Submitted invoices enter the 4-step approval chain',
    ],
  },
  timesheets: {
    what: 'Contractor hours, approved before billing.',
    points: [
      'Contractors log hours per week against their PO',
      'Managers approve or reject with a comment',
      'An approved timesheet can draft the invoice in one click',
    ],
  },
  statements: {
    what: 'The supplier-facing account view.',
    points: [
      'Self-serve supplier statement — balance, history and payment progress',
      'The 4-dot tracker shows exactly where each invoice sits',
      'Remittance advice downloads per payment',
    ],
  },
  onboarding: {
    what: 'Get suppliers payment-ready.',
    points: [
      'Five steps gate payment eligibility — tax, bank, contract, compliance',
      'Blocked steps hold supplier invoices until resolved',
      'Invite new suppliers from here',
    ],
  },
  pos: {
    what: 'Purchase orders and work orders.',
    points: [
      'Purchase orders cap spend with a not-to-exceed amount',
      'Drawdown bars show billed vs remaining per PO',
      'For labor, the PO is the work order — rate card plus hour budget',
    ],
  },
  approvals: {
    what: 'The 4-step approval queue.',
    points: [
      'Fixed 4-step chain on every invoice: AP, HR/Manager/Budget owner, Finance head, CEO',
      'Tabs split the queue by role',
      "The dot stepper shows each invoice's progress through the chain",
    ],
  },
  payments: {
    what: 'Payment runs with dual control.',
    points: [
      'Batches require dual control — creator cannot release',
      'The optimizer flags early-pay discounts worth taking',
      'FX exposure card groups upcoming outflow by currency',
    ],
  },
  suppliers: {
    what: 'Your supplier directory and risk view.',
    points: [
      'Directory with compliance status — W-9/VAT and bank verification',
      'Risk levels combine compliance gaps and billing history',
      'Live badge means rows come from the production database',
    ],
  },
  clientpos: {
    what: 'The revenue side of the ledger.',
    points: [
      'The revenue side: client POs your supplier costs map against',
      'Margin per engagement = client value minus mapped supplier cost',
      'Unmapped billable cost appears in Month-end as an exception',
    ],
  },
  budgets: {
    what: 'Cost-centre budgets vs burn.',
    points: [
      'FY budgets per cost centre in group GBP',
      'Committed = open PO caps; actual = billed to date',
      'Alerts fire at 85% burn',
    ],
  },
  contracts: {
    what: 'Supplier contracts and rate cards.',
    points: [
      'MSAs, SOWs, NDAs, rate cards and SDS documents per supplier',
      'Expiring or missing contracts are flagged before they block billing',
      'Rate cards feed PO rate locking and overrun checks',
    ],
  },
  assurance: {
    what: 'The month-end billing ritual.',
    points: [
      'Month-end ritual: prove every supplier invoice maps to a client PO',
      'Fix exceptions by mapping or marking internal',
      'Complete the checklist to close the period',
    ],
  },
  compliance: {
    what: 'IR35 and country invoicing rules.',
    points: [
      'IR35 status per engagement — inside routes via umbrella or payroll',
      'Missing SDS documents block first invoices',
      "Country rules reference shows each jurisdiction's invoice mandates",
    ],
  },
  entities: {
    what: 'Group entities and currencies.',
    points: [
      'One functional currency per entity; transaction currencies are unlimited',
      'Add or deactivate entities — changes are audit-logged',
      'New entities appear in the top-bar switcher immediately',
    ],
  },
  users: {
    what: 'Who sees what, who approves what.',
    points: [
      'Role × entity scoping controls what each user sees and approves',
      'Delegations re-route approval queues during absences',
      'The capability matrix shows what every role can do',
    ],
  },
  admin: {
    what: 'Chain configuration and the audit trail.',
    points: [
      'Approver assignments are editable; the chain shape is fixed',
      'Post-approval overrides need a written reason and are audit-logged',
      'The audit log is append-only — history is never deleted',
    ],
  },
  reports: {
    what: 'The AP reporting suite.',
    points: [
      'AP aging, month-end accrual and spend analysis',
      'Figures compute live from the subledger',
      'Export stubs ready for XLSX/CSV',
    ],
  },
}
