import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { buildSuggestions, matchSuggestions } from './suggestions'

let id = 0
function expense(name: string | undefined, day: number, patch: Partial<Expense> = {}): Expense {
  const iso = new Date(2026, 9, day, 12).toISOString()
  return {
    id: String(++id),
    amount: 1000,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    name,
    ...patch,
  }
}

describe('buildSuggestions', () => {
  it('keeps one per name, with how it was loaded the last time', () => {
    const [nafta] = buildSuggestions([
      expense('nafta', 1, { amount: 20_000, category: 'transport' }),
      expense('Nafta', 9, { amount: 25_000, category: 'transport', paymentMethod: 'card' }),
      expense('NAFTA ', 5, { amount: 22_000 }),
    ])
    expect(nafta).toEqual({
      name: 'Nafta',
      category: 'transport',
      paymentMethod: 'card',
      currency: 'ARS',
      amount: 25_000,
      count: 3,
      lastAt: new Date(2026, 9, 9, 12).toISOString(),
    })
  })

  it('suggests a dollar expense in dollars', () => {
    const [netflix] = buildSuggestions([
      expense('Netflix', 3, { amount: 15_000, currency: 'USD', foreignAmount: 10 }),
    ])
    expect(netflix).toMatchObject({ currency: 'USD', amount: 10 })
  })

  it('leaves out deleted ones, fixed payments and expenses without a name', () => {
    expect(
      buildSuggestions([
        expense('Cine', 1, { deleted: true }),
        expense('Alquiler', 1, { fixedExpenseId: 'rent' }),
        expense(undefined, 1),
        expense('  ', 1),
      ]),
    ).toEqual([])
  })
})

describe('matchSuggestions', () => {
  const suggestions = buildSuggestions([
    expense('Nafta', 1),
    expense('Pan de nata', 2),
    expense('Pan de nata', 3),
    expense('Cine', 4),
  ])
  const names = (typed: string) => matchSuggestions(suggestions, typed).map((s) => s.name)

  it('finds any word starting with what is typed, names starting with it first', () => {
    expect(names('na')).toEqual(['Nafta', 'Pan de nata'])
  })

  it('ignores case and accents', () => {
    expect(names('CÍN')).toEqual(['Cine'])
  })

  it('suggests nothing for an empty text or a name already typed in full', () => {
    expect(names('')).toEqual([])
    expect(names('cine')).toEqual([])
  })
})
