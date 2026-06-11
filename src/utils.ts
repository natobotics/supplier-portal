export const TODAY = new Date('2026-06-11')

export function fmtMoney(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: n >= 10000 ? 0 : 2,
  }).format(n)
}

export function fmtCompact(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(iso: string): number {
  const d = new Date(iso + 'T00:00:00')
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000)
}

export function daysOverdue(iso: string): number {
  return -daysUntil(iso)
}

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+'

export function agingBucket(dueDate: string): AgingBucket {
  const over = daysOverdue(dueDate)
  if (over <= 0) return 'current'
  if (over <= 30) return '1-30'
  if (over <= 60) return '31-60'
  if (over <= 90) return '61-90'
  return '90+'
}

export function cls(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// Group reporting currency is GBP. Static demo rates (X → GBP).
export const REPORTING_CURRENCY = 'GBP'

export const FX_TO_GBP: Record<string, number> = {
  GBP: 1,
  USD: 0.79,
  EUR: 0.85,
  PLN: 0.2,
  AED: 0.215,
  INR: 0.0095,
  SGD: 0.585,
  SEK: 0.074,
  JPY: 0.0051,
}

export function toGBP(amount: number, currency: string): number {
  return amount * (FX_TO_GBP[currency] ?? 1)
}

// Cross-rate via GBP. Entities have ONE functional currency but transact in many —
// use this to express mixed-currency sums in the entity's functional currency.
export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount
  return (amount * (FX_TO_GBP[from] ?? 1)) / (FX_TO_GBP[to] ?? 1)
}

export function fmtGBP(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}
