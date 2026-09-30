import { db, type ShoppingItem } from '@/lib/db'
import { MAX_QUANTITY, normalizeName, type ParsedItem } from './items'

// Single entry point to the local shopping list: components never touch Dexie directly
export const shoppingRepo = {
  // Adds to the list, or bumps the quantity if the same product is already on it
  async add({ name, quantity }: ParsedItem, now = new Date()) {
    const updatedAt = now.toISOString()
    const key = normalizeName(name)

    return db.transaction('rw', db.shoppingItems, async () => {
      const existing = (await db.shoppingItems.toArray()).find(
        (i) => !i.deleted && i.status !== 'bought' && normalizeName(i.name) === key,
      )
      if (existing) {
        await db.shoppingItems.update(existing.id, {
          quantity: Math.min(existing.quantity + quantity, MAX_QUANTITY),
          updatedAt,
          pending: 1,
        })
        return existing.id
      }

      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        name,
        quantity,
        status: 'to_buy',
        updatedAt,
        deleted: false,
        pending: 1,
      }
      await db.shoppingItems.add(item)
      return item.id
    })
  },

  // In the store: to buy ↔ in cart
  async toggle(id: string, now = new Date()) {
    const item = await db.shoppingItems.get(id)
    if (!item || item.status === 'bought') return
    await db.shoppingItems.update(id, {
      status: item.status === 'to_buy' ? 'in_cart' : 'to_buy',
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  async remove(id: string, now = new Date()) {
    await db.shoppingItems.update(id, {
      deleted: true,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  // Moves everything in the cart to history; returns how many items were bought
  async finishPurchase(now = new Date()) {
    const iso = now.toISOString()
    return db.shoppingItems
      .where('status')
      .equals('in_cart')
      .filter((i) => !i.deleted)
      .modify({ status: 'bought', boughtAt: iso, updatedAt: iso, pending: 1 })
  },

  all() {
    return db.shoppingItems.toArray()
  },
}
