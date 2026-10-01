import { db, type Income } from '@/lib/db'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { shiftMonth } from '@/utils/dates'

export interface NewIncome {
  amount: number
  name?: string
  note?: string
  receivedAt?: string // ISO; now when missing
}

// What can be corrected on an income already loaded. `name: undefined` / `note: undefined`
// clear them.
export type IncomeChanges = Partial<Pick<Income, 'amount' | 'name' | 'note' | 'receivedAt'>>

// Single entry point to local incomes: components never touch Dexie directly
export const incomesRepo = {
  async add(data: NewIncome, now = new Date()) {
    const iso = now.toISOString()
    const id = crypto.randomUUID()
    await db.incomes.add({
      ...data,
      id,
      receivedAt: data.receivedAt ?? iso,
      updatedAt: iso,
      deleted: false,
      pending: 1,
    })
    return id
  },

  async update(id: string, changes: IncomeChanges, now = new Date()) {
    await db.incomes.update(id, { ...changes, updatedAt: now.toISOString(), pending: 1 })
  },

  async remove(id: string, now = new Date()) {
    await db.incomes.update(id, { deleted: true, updatedAt: now.toISOString(), pending: 1 })
  },

  // One income, deleted or not (undefined if it doesn't exist). For live queries.
  get(id: string) {
    return db.incomes.get(id)
  },

  // Non-deleted incomes from `start` up to (not including) `end`, newest first
  between(start: Date, end: Date) {
    return db.incomes
      .where('receivedAt')
      .between(start.toISOString(), end.toISOString(), true, false)
      .reverse()
      .filter((i) => !i.deleted)
      .toArray()
  },
}

// Non-deleted incomes before a date: every month already gone. For live queries.
export function getIncomesBefore(date: Date) {
  return incomesRepo.between(new Date(0), date)
}

// A month's incomes, newest first, and what they add up to; undefined while loading
export function useMonthIncomes(month: Date) {
  return useKeyedLiveQuery(async () => {
    const incomes = await incomesRepo.between(month, shiftMonth(month, 1))
    return { incomes, total: incomes.reduce((sum, i) => sum + i.amount, 0) }
  }, month.getTime())
}
