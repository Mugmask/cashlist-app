import { describe, expect, it } from 'vitest'
import { buildDemoData } from './demoData'

// Six days into a month, like when it was written: part of this month's fixed are due
const NOW = new Date(2026, 9, 6, 18)

describe('buildDemoData', () => {
  const data = buildDemoData(NOW)

  it('never dates anything after now', () => {
    const dates = [...data.expenses.map((e) => e.spentAt), ...data.incomes.map((i) => i.receivedAt)]
    expect(dates.every((iso) => new Date(iso) <= NOW)).toBe(true)
  })

  it('covers this month and the two before', () => {
    const months = new Set(data.expenses.map((e) => new Date(e.spentAt).getMonth()))
    expect([...months].sort()).toEqual([7, 8, 9])
  })

  it('pays every fixed expense in past months, this month only the ones already due', () => {
    for (const fixed of data.fixedExpenses) {
      const periods = data.expenses
        .filter((e) => e.fixedExpenseId === fixed.id)
        .map((e) => e.fixedPeriod)
        .sort()
      const dueThisMonth = fixed.dueDay! <= NOW.getDate()
      expect(periods).toEqual(
        dueThisMonth ? ['2026-08', '2026-09', '2026-10'] : ['2026-08', '2026-09'],
      )
    }
  })

  it('records only my part of a shared bill, keeping the whole one', () => {
    const rent = data.fixedExpenses.find((f) => f.name === 'Alquiler')!
    const payment = data.expenses.find((e) => e.fixedExpenseId === rent.id)!
    expect(payment.amount).toBe(rent.amount / rent.shareWith!)
    expect(payment.sharedTotal).toBe(rent.amount)
  })

  it('keeps dollar expenses in pesos, with the dollars beside', () => {
    const dollars = data.expenses.filter((e) => e.currency === 'USD')
    expect(dollars.length).toBeGreaterThan(0)
    for (const e of dollars) expect(e.amount).toBeCloseTo(e.foreignAmount! * e.exchangeRate!, 1)
  })

  it('gives every record its own id, nothing pending to sync', () => {
    const records = [
      ...data.expenses,
      ...data.incomes,
      ...data.fixedExpenses,
      ...data.shoppingItems,
      ...data.recipes,
    ]
    expect(new Set(records.map((r) => r.id)).size).toBe(records.length)
    expect(records.every((r) => r.pending === 0 && !r.deleted)).toBe(true)
  })
})
