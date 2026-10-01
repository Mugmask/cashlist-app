import type { Expense, PaymentMethod } from '@/lib/db'
import { normalizeName } from '@/utils/text'

// A name already used, with how it was loaded the last time: picking it fills the form so a
// repeated expense ("Nafta") is three letters and a tap.
export interface NameSuggestion {
  name: string // as written the last time
  category: string
  paymentMethod: PaymentMethod
  currency: 'ARS' | 'USD'
  amount: number // the last one, in its currency (dollars for a dollar expense)
  count: number // how many times it was used
  lastAt: string // ISO, when it was last spent
}

const MAX_SUGGESTIONS = 4 // a row of chips under the field

// One suggestion per name (case, accents and spaces aside), from the user's own expenses.
// Fixed payments are left out: they're loaded from the fixed expenses screen.
export function buildSuggestions(expenses: readonly Expense[]): NameSuggestion[] {
  const byName = new Map<string, NameSuggestion>()
  for (const e of expenses) {
    if (e.deleted || e.fixedExpenseId || !e.name?.trim()) continue
    const key = normalizeName(e.name)
    const current = byName.get(key)
    const count = (current?.count ?? 0) + 1
    if (current && current.lastAt >= e.spentAt) {
      current.count = count
      continue
    }
    const dollars = e.currency === 'USD' && e.foreignAmount !== undefined
    byName.set(key, {
      name: e.name.trim(),
      category: e.category,
      paymentMethod: e.paymentMethod ?? 'cash',
      currency: dollars ? 'USD' : 'ARS',
      amount: dollars ? e.foreignAmount! : e.amount,
      count,
      lastAt: e.spentAt,
    })
  }
  return [...byName.values()]
}

// The ones that go with what's typed: a word of the name starting with it ("nat" finds
// "Nafta" and "Pan de Nata"), names starting with it first, then the most used, then the
// latest. Nothing for an empty text or for a name typed in full.
export function matchSuggestions(
  suggestions: readonly NameSuggestion[],
  typed: string,
): NameSuggestion[] {
  const query = normalizeName(typed)
  if (!query) return []
  return suggestions
    .map((s) => ({ s, key: normalizeName(s.name) }))
    .filter(({ key }) => key !== query && key.split(' ').some((word) => word.startsWith(query)))
    .sort(
      (a, b) =>
        Number(b.key.startsWith(query)) - Number(a.key.startsWith(query)) ||
        b.s.count - a.s.count ||
        b.s.lastAt.localeCompare(a.s.lastAt),
    )
    .slice(0, MAX_SUGGESTIONS)
    .map(({ s }) => s)
}
