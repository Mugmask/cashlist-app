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

// Single entry point to the pantry/list. A product has one row that cycles
// in_stock → to_buy → in_cart → in_stock; components never touch Dexie directly.
export const shoppingRepo = {
  // Puts a product on the list: new, back from the pantry, or bumping the quantity
  add({ name, quantity }: ParsedItem, now = new Date()) {
    return db.transaction('rw', db.shoppingItems, async () => {
      const existing = await findByName(name)
      if (!existing) return newItem(name, 'to_buy', quantity, now)

      const onList = existing.status !== 'in_stock'
      await write(
        existing.id,
        {
          status: onList ? existing.status : 'to_buy',
          quantity: onList ? Math.min(existing.quantity + quantity, MAX_QUANTITY) : quantity,
        },
        now,
      )
      return existing.id
    })
  },

  // Registers a product you have at home, without putting it on the list
  addToPantry(name: string, now = new Date()) {
    return db.transaction('rw', db.shoppingItems, async () => {
      const existing = await findByName(name)
      return existing ? existing.id : newItem(name, 'in_stock', 1, now)
    })
  },

  // "Se acabó": the product goes back on the list
  async runOut(id: string, now = new Date()) {
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

  // Off the list: a product bought before goes back to the pantry, a new one is deleted
  async removeFromList(id: string, now = new Date()) {
    const item = await db.shoppingItems.get(id)
    if (!item) return
    await write(
      id,
      item.timesBought > 0 ? { status: 'in_stock', quantity: 1 } : { deleted: true },
      now,
    )
  },

  // "Ya no lo compro": the product disappears from the pantry
  async removeProduct(id: string, now = new Date()) {
    await write(id, { deleted: true }, now)
  },

  // Everything in the cart goes home; returns how many products were bought
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
