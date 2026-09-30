import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { shoppingRepo } from './shoppingRepo'

beforeEach(async () => {
  await db.shoppingItems.clear()
})

const get = (id: string) => db.shoppingItems.get(id)

async function buy(id: string) {
  await shoppingRepo.toggle(id)
  await shoppingRepo.finishPurchase()
}

describe('shoppingRepo', () => {
  it('add puts a new product on the list, pending upload', async () => {
    const id = await shoppingRepo.add({ name: 'Leche', quantity: 2 })

    expect(await get(id)).toMatchObject({
      name: 'Leche',
      quantity: 2,
      status: 'to_buy',
      timesBought: 0,
      pending: 1,
    })
  })

  it('adding a product already on the list bumps its quantity', async () => {
    const id = await shoppingRepo.add({ name: 'Azúcar', quantity: 1 })
    expect(await shoppingRepo.add({ name: 'azucar', quantity: 2 })).toBe(id)

    expect(await db.shoppingItems.count()).toBe(1)
    expect((await get(id))?.quantity).toBe(3)
  })

  it('the full cycle: list → cart → home → run out → list, always the same row', async () => {
    const id = await shoppingRepo.add({ name: 'Yerba', quantity: 2 })
    const boughtAt = new Date('2026-09-30T18:00:00Z')

    await shoppingRepo.toggle(id)
    expect((await get(id))?.status).toBe('in_cart')

    expect(await shoppingRepo.finishPurchase(boughtAt)).toBe(1)
    expect(await get(id)).toMatchObject({
      status: 'in_stock',
      quantity: 1,
      timesBought: 1,
      lastBoughtAt: boughtAt.toISOString(),
    })

    await shoppingRepo.runOut(id)
    expect((await get(id))?.status).toBe('to_buy')
    expect(await db.shoppingItems.count()).toBe(1)
  })

  it('adding a product that is at home puts it back on the list with that quantity', async () => {
    const id = await shoppingRepo.add({ name: 'Pan', quantity: 1 })
    await buy(id)

    expect(await shoppingRepo.add({ name: 'pan', quantity: 3 })).toBe(id)
    expect(await get(id)).toMatchObject({ status: 'to_buy', quantity: 3 })
  })

  it('finishPurchase only takes what is in the cart', async () => {
    const inCart = await shoppingRepo.add({ name: 'Huevos', quantity: 12 })
    const toBuy = await shoppingRepo.add({ name: 'Fideos', quantity: 1 })
    await shoppingRepo.toggle(inCart)

    await shoppingRepo.finishPurchase()

    expect((await get(inCart))?.status).toBe('in_stock')
    expect((await get(toBuy))?.status).toBe('to_buy')
  })

  it('removeFromList sends a known product home and deletes a new one', async () => {
    const known = await shoppingRepo.add({ name: 'Café', quantity: 1 })
    await buy(known)
    await shoppingRepo.runOut(known)
    const fresh = await shoppingRepo.add({ name: 'Algo nuevo', quantity: 1 })

    await shoppingRepo.removeFromList(known)
    await shoppingRepo.removeFromList(fresh)

    expect(await get(known)).toMatchObject({ status: 'in_stock', deleted: false })
    expect((await get(fresh))?.deleted).toBe(true)
  })

  it('addToPantry registers a product at home, once', async () => {
    const id = await shoppingRepo.addToPantry('Detergente')
    expect(await shoppingRepo.addToPantry('detergente')).toBe(id)

    expect(await get(id)).toMatchObject({ status: 'in_stock', timesBought: 0 })
    expect(await db.shoppingItems.count()).toBe(1)
  })

  it('a removed product can be added again as new', async () => {
    const id = await shoppingRepo.addToPantry('Queso')
    await shoppingRepo.removeProduct(id)

    const again = await shoppingRepo.add({ name: 'Queso', quantity: 1 })
    expect(again).not.toBe(id)
  })
})
