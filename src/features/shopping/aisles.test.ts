import { describe, expect, it } from 'vitest'
import { aisleOf, groupByAisle, guessAisle } from './aisles'

describe('guessAisle', () => {
  it.each([
    ['Tomates', 'produce'],
    ['Papa', 'produce'],
    ['Pan', 'bakery'],
    ['Pan rallado', 'pantry'],
    ['Papas fritas', 'pantry'],
    ['Leche', 'dairy'],
    ['Dulce de leche', 'dairy'],
    ['Huevos', 'dairy'],
    ['Pollo', 'meat'],
    ['Salame', 'dairy'],
    ['Sal', 'pantry'],
    ['Salsa de tomate', 'pantry'],
    ['Jugo de naranja', 'drinks'],
    ['Yerba', 'pantry'],
    ['Café', 'pantry'],
    ['Helado', 'frozen'],
    ['Detergente', 'cleaning'],
    ['Jabón en polvo', 'cleaning'],
    ['Jabón', 'personal'],
    ['Papel higiénico', 'personal'],
    ['Pañales', 'personal'],
    ['Pilas', 'other'],
  ])('%s → %s', (name, aisle) => {
    expect(guessAisle(name)).toBe(aisle)
  })
})

describe('aisleOf', () => {
  it('takes the section picked over the guess, and ignores an unknown one', () => {
    expect(aisleOf({ name: 'Pilas', aisle: 'cleaning' })).toBe('cleaning')
    expect(aisleOf({ name: 'Leche', aisle: 'nope' })).toBe('dairy')
    expect(aisleOf({ name: 'Leche' })).toBe('dairy')
  })
})

describe('groupByAisle', () => {
  it("follows the store's order and keeps each group's order", () => {
    const groups = groupByAisle([
      { name: 'Yerba' },
      { name: 'Tomate' },
      { name: 'Arroz' },
      { name: 'Banana' },
    ])
    expect(groups.map((g) => g.aisle)).toEqual(['produce', 'pantry'])
    expect(groups[0].items.map((i) => i.name)).toEqual(['Tomate', 'Banana'])
    expect(groups[1].items.map((i) => i.name)).toEqual(['Yerba', 'Arroz'])
  })
})
