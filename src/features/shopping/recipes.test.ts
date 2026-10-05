import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { inPantry, productSuggestions, withIngredient } from './recipes'
import { recipesRepo } from './recipesRepo'

beforeEach(async () => {
  await db.recipes.clear()
  await db.shoppingItems.clear()
})

describe('withIngredient', () => {
  it('adds a new ingredient at the end', () => {
    expect(withIngredient([{ name: 'Papa', quantity: 4 }], { name: 'Huevo', quantity: 2 })).toEqual(
      [
        { name: 'Papa', quantity: 4 },
        { name: 'Huevo', quantity: 2 },
      ],
    )
  })

  it('adds the count to one already there, whatever its case or accents', () => {
    expect(
      withIngredient([{ name: 'Limón', quantity: 1 }], { name: 'limon', quantity: 2 }),
    ).toEqual([{ name: 'Limón', quantity: 3 }])
  })
})

describe('productSuggestions', () => {
  const products = ['Papa', 'Pan rallado', 'Huevo', 'Puré de tomate']

  it('finds products by any word, those starting with it first', () => {
    expect(productSuggestions(products, 'pa', [])).toEqual(['Pan rallado', 'Papa'])
    expect(productSuggestions(products, 'tom', [])).toEqual(['Puré de tomate'])
  })

  it('leaves out what the recipe already has and a name typed in full', () => {
    expect(productSuggestions(products, 'pa', [{ name: 'papa', quantity: 1 }])).toEqual([
      'Pan rallado',
    ])
    expect(productSuggestions(products, 'huevo', [])).toEqual([])
  })
})

describe('recipesRepo', () => {
  it('create stores a recipe pending upload; all lists the non-deleted alphabetically', async () => {
    const tarta = await recipesRepo.create({ name: 'Tarta', ingredients: [] })
    await recipesRepo.create({
      name: 'Milanesas',
      ingredients: [{ name: 'Pan rallado', quantity: 1 }],
    })
    expect(await db.recipes.get(tarta)).toMatchObject({ pending: 1, deleted: false })

    await recipesRepo.remove(tarta)
    expect((await recipesRepo.all()).map((r) => r.name)).toEqual(['Milanesas'])
  })

  it('cook puts what is missing on the list, adding to what is already there', async () => {
    await db.shoppingItems.add({
      id: 'papa',
      name: 'Papa',
      quantity: 2,
      status: 'to_buy',
      timesBought: 0,
      updatedAt: '2026-10-01T12:00:00Z',
      deleted: false,
      pending: 0,
    })

    const count = await recipesRepo.cook([
      { name: 'Papa', quantity: 4 },
      { name: 'Huevo', quantity: 2 },
    ])

    expect(count).toBe(2)
    const items = await db.shoppingItems.toArray()
    expect(items.map((i) => [i.name, i.quantity, i.status]).sort()).toEqual([
      ['Huevo', 2, 'to_buy'],
      ['Papa', 6, 'to_buy'],
    ])
  })
})

describe('inPantry', () => {
  it('finds the ingredients the pantry has, by name like the list', () => {
    const ingredients = [
      { name: 'Fideos', quantity: 1 },
      { name: 'Tomate', quantity: 3 },
      { name: 'Cebolla', quantity: 1 },
    ]
    expect(inPantry(ingredients, ['fideos', 'Cebolla ', 'Arroz'])).toEqual(
      new Set(['Fideos', 'Cebolla']),
    )
    expect(inPantry(ingredients, [])).toEqual(new Set())
  })
})
