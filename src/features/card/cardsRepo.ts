import { db } from '@/lib/db'
import type { Cycle } from './cycles'

export const MAX_CARD_NAME = 24 // a tile title, a chip: little room

// Single entry point to the user's cards and their cycles: components never touch Dexie directly
export const cardsRepo = {
  // The first card takes every card purchase loaded before it, so a second one added later
  // doesn't make them change hands
  async create(name: string, now = new Date()) {
    const id = crypto.randomUUID()
    const updatedAt = now.toISOString()
    await db.transaction('rw', db.cards, db.expenses, async () => {
      const others = await db.cards.filter((c) => !c.deleted).count()
      await db.cards.add({ id, name, updatedAt, deleted: false, pending: 1 })
      if (others > 0) return
      await db.expenses
        .filter((e) => !e.deleted && e.paymentMethod === 'card' && !e.cardId)
        .modify({ cardId: id, updatedAt, pending: 1 })
    })
    return id
  },

  async rename(id: string, name: string, now = new Date()) {
    await db.cards.update(id, { name, updatedAt: now.toISOString(), pending: 1 })
  },

  // Its purchases stay as they are: they still say what was paid with it
  async remove(id: string, now = new Date()) {
    await db.cards.update(id, { deleted: true, updatedAt: now.toISOString(), pending: 1 })
  },

  // The real dates of a statement, over the ones known or estimated for it (`cycle`)
  async setDates(cardId: string, cycle: Cycle, closesOn: string, dueOn: string, now = new Date()) {
    const updatedAt = now.toISOString()
    const same = cycle.estimated
      ? undefined
      : await db.cardCycles
          .where('cardId')
          .equals(cardId)
          .filter((c) => !c.deleted && c.closesOn === cycle.closesOn)
          .first()
    if (same) {
      await db.cardCycles.update(same.id, { closesOn, dueOn, updatedAt, pending: 1 })
      return
    }
    await db.cardCycles.add({
      id: crypto.randomUUID(),
      cardId,
      closesOn,
      dueOn,
      updatedAt,
      deleted: false,
      pending: 1,
    })
  },

  // Every card and cycle, deleted ones too (a deleted card still names its purchases). For
  // live queries.
  async all() {
    const [cards, cycles] = await Promise.all([db.cards.toArray(), db.cardCycles.toArray()])
    return { cards, cycles }
  },

  // The card of the latest card purchase that names one: the likeliest for the next one
  async lastUsed() {
    const latest = await db.expenses
      .orderBy('spentAt')
      .reverse()
      .filter((e) => !e.deleted && e.paymentMethod === 'card' && !!e.cardId)
      .first()
    return latest?.cardId
  },
}
