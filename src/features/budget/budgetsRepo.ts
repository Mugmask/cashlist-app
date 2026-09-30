import { db } from '@/lib/db'

// Single entry point to local budgets. A budget's id is its category id.
export const budgetsRepo = {
  // Creates or replaces the monthly limit of a category (also revives a removed one)
  async set(category: string, amount: number, now = new Date()) {
    await db.budgets.put({
      id: category,
      amount,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  },

  async remove(category: string, now = new Date()) {
    await db.budgets.update(category, {
      deleted: true,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  async active() {
    return (await db.budgets.toArray()).filter((b) => !b.deleted)
  },
}
