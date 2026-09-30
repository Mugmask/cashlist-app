import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { shoppingRepo } from './shoppingRepo'

beforeEach(async () => {
  await db.shoppingItems.clear()
})

describe('shoppingRepo', () => {
  it('add creates a to-buy item pending upload', async () => {
    const id = await shoppingRepo.add({ name: 'Leche', quantity: 2 })

    expect(await db.shoppingItems.get(id)).toMatchObject({
      name: 'Leche',
      quantity: 2,
      status: 'to_buy',
      deleted: false,
      pending: 1,
    })
  })

  it('adding the same product again bumps its quantity instead of duplicating', async () => {
    const id = await shoppingRepo.add({ name: 'Azúcar', quantity: 1 })
    const again = await shoppingRepo.add({ name: 'azucar', quantity: 2 })

    expect(again).toBe(id)
    expect(await db.shoppingItems.count()).toBe(1)
    expect((await db.shoppingItems.get(id))?.quantity).toBe(3)
  })

  it('a product bought before is added as a new item, keeping the history', async () => {
    const first = await shoppingRepo.add({ name: 'Pan', quantity: 1 })
    await shoppingRepo.toggle(first)
    await shoppingRepo.finishPurchase()

    const second = await shoppingRepo.add({ name: 'Pan', quantity: 1 })

    expect(second).not.toBe(first)
    expect((await db.shoppingItems.get(first))?.status).toBe('bought')
  })

  it('toggle moves an item between to buy and in cart', async () => {
    const id = await shoppingRepo.add({ name: 'Yerba', quantity: 1 })

    await shoppingRepo.toggle(id)
    expect((await db.shoppingItems.get(id))?.status).toBe('in_cart')

    await shoppingRepo.toggle(id)
    expect((await db.shoppingItems.get(id))?.status).toBe('to_buy')
  })

  it('finishPurchase moves only the cart to history', async () => {
    const inCart = await shoppingRepo.add({ name: 'Huevos', quantity: 12 })
    const toBuy = await shoppingRepo.add({ name: 'Fideos', quantity: 1 })
    await shoppingRepo.toggle(inCart)
    const now = new Date('2026-09-30T18:00:00Z')

    const count = await shoppingRepo.finishPurchase(now)

    expect(count).toBe(1)
    expect(await db.shoppingItems.get(inCart)).toMatchObject({
      status: 'bought',
      boughtAt: now.toISOString(),
      pending: 1,
    })
    expect((await db.shoppingItems.get(toBuy))?.status).toBe('to_buy')
  })
})
