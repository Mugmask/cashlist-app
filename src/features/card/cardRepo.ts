import { db } from '@/lib/db'

// Card statements marked as paid, one per purchase month ("2026-09")
export const cardRepo = {
  async markPaid(period: string, now = new Date()) {
    const iso = now.toISOString()
    await db.cardStatements.put({
      id: period,
      paidAt: iso,
      updatedAt: iso,
      deleted: false,
      pending: 1,
    })
  },

  async unmarkPaid(period: string, now = new Date()) {
    await db.cardStatements.update(period, {
      deleted: true,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  all() {
    return db.cardStatements.toArray()
  },
}
