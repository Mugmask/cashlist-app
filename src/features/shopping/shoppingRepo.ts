import { db, type ShoppingItem } from '@/lib/db'
import { normalizeName } from '@/utils/text'
import { MAX_QUANTITY, type ParsedItem } from './items'

type Changes = Partial<Omit<ShoppingItem, 'id' | 'pending' | 'updatedAt'>>

// Every write marks the row pending upload with a fresh updatedAt
function write(id: string, changes: Changes, now: Date) {
  return db.shoppingItems.update(id, { ...changes, updatedAt: now.toISOString(), pending: 1 })
}

async function findByName(name: string) {
  const key = normalizeName(name)
  return (await db.shoppingItems.toArray()).find((i) => !i.deleted && normalizeName(i.name) === key)
}

function newItem(name: string, status: ShoppingItem['status'], quantity: number, now: Date) {
  const item: ShoppingItem = {
    id: crypto.randomUUID(),
    name,
    quantity,
    status,
    timesBought: 0,
    updatedAt: now.toISOString(),
    deleted: false,
    pending: 1,
  }
  return db.shoppingItems.add(item).then(() => item.id)
}

// What adding did, so the screen can say it: a new product, one known that's back on the
// list, or more of one already on it
export interface AddResult {
  id: string
  outcome: 'new' | 'back' | 'more'
  name: string
  quantity: number // on the list now
}

// Single entry point to the shopping products. A product has one row that cycles
// off the list (in_stock) → to_buy → in_cart → off the list; components never touch Dexie.
export const shoppingRepo = {
  // Puts a product on the list: new, a known one back, or bumping the quantity
  add({ name, quantity }: ParsedItem, now = new Date()): Promise<AddResult> {
    return db.transaction('rw', db.shoppingItems, async () => {
      const existing = await findByName(name)
      if (!existing) {
        return { id: await newItem(name, 'to_buy', quantity, now), outcome: 'new', name, quantity }
      }
      const onList = existing.status !== 'in_stock'
      const total = onList ? Math.min(existing.quantity + quantity, MAX_QUANTITY) : quantity
      await write(
        existing.id,
        { status: onList ? existing.status : 'to_buy', quantity: total },
        now,
      )
      return {
        id: existing.id,
        outcome: onList ? 'more' : 'back',
        name: existing.name,
        quantity: total,
      }
    })
  },

  // A known product (a frequent one) back on the list, one unit
  async addAgain(id: string, now = new Date()) {
    const item = await db.shoppingItems.get(id)
    if (item?.status !== 'in_stock') return
    await write(id, { status: 'to_buy', quantity: 1 }, now)
  },

  // In the store: to buy ↔ in cart
  async toggle(id: string, now = new Date()) {
    const item = await db.shoppingItems.get(id)
    if (!item || item.status === 'in_stock') return
    await write(id, { status: item.status === 'to_buy' ? 'in_cart' : 'to_buy' }, now)
  },

  // Off the list: a product bought before stays known (a frequent one), a new one is deleted
  async removeFromList(id: string, now = new Date()) {
    const item = await db.shoppingItems.get(id)
    if (!item) return
    await write(
      id,
      item.timesBought > 0 ? { status: 'in_stock', quantity: 1 } : { deleted: true },
      now,
    )
  },

  // "Ya no lo compro": the product is forgotten, so it stops showing among the frequent ones
  async forget(id: string, now = new Date()) {
    await write(id, { deleted: true }, now)
  },

  // Everything in the cart is bought: off the list, counted for the frequent ones. Returns
  // how many products it was.
  finishPurchase(now = new Date()) {
    const iso = now.toISOString()
    return db.shoppingItems
      .where('status')
      .equals('in_cart')
      .filter((i) => !i.deleted)
      .modify((item) => {
        item.status = 'in_stock'
        item.quantity = 1
        item.lastBoughtAt = iso
        item.timesBought += 1
        item.updatedAt = iso
        item.pending = 1
      })
  },

  all() {
    return db.shoppingItems.toArray()
  },
}
