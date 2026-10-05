import type { Expense } from '@/lib/db'

// How an expense paid in full is shared: just mine, between 2, 3 or 4 alike, or an exact part
export type ShareOption = '1' | '2' | '3' | '4' | 'part'

export const SHARE_CHIPS: readonly { value: ShareOption; label: string }[] = [
  { value: '1', label: 'Solo mío' },
  { value: '2', label: 'A medias' },
  { value: '3', label: 'Entre 3' },
  { value: '4', label: 'Entre 4' },
  { value: 'part', label: 'Mi parte…' },
]

// My part of `total` split between `people` alike, in whole cents (the rounding is on the
// others, like the last installment's): 100 between 3 → 33.33
export function shareOf(total: number, people: number) {
  return Math.floor(Math.round(total * 100) / people) / 100
}

// What was really charged for an expense, in pesos: the whole bill when it was shared (what
// the card statement brings), else its amount
export function chargedOf(expense: Pick<Expense, 'amount' | 'sharedTotal'>) {
  return expense.sharedTotal ?? expense.amount
}

// Between how many alike `mine` is of `total` (2 to 4), or 'part' when it's an exact amount
export function shareOptionFor(total: number, mine: number): ShareOption {
  for (const people of [2, 3, 4] as const) {
    if (shareOf(total, people) === mine) return String(people) as ShareOption
  }
  return 'part'
}

// "A medias", "Entre 3"; null for an exact part or an expense not shared
export function describeShare(expense: Pick<Expense, 'amount' | 'sharedTotal'>) {
  if (expense.sharedTotal === undefined) return null
  const option = shareOptionFor(expense.sharedTotal, expense.amount)
  return option === 'part' ? null : SHARE_CHIPS.find((c) => c.value === option)!.label
}
