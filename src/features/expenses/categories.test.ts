import { afterEach, describe, expect, it } from 'vitest'
import type { CustomCategory } from '@/lib/db'
import { BUILT_IN_CATEGORIES, getCategory, OTHER_ID, setCustomCategories } from './categories'
import { CATEGORY_ICONS } from './categoryIcons'

const custom = (
  id: string,
  name: string,
  changes: Partial<CustomCategory> = {},
): CustomCategory => ({
  id,
  name,
  icon: 'fuel',
  color: 2,
  updatedAt: '2026-10-01T12:00:00Z',
  deleted: false,
  pending: 0,
  ...changes,
})

afterEach(() => setCustomCategories([]))

describe('getCategory', () => {
  it('maps categories folded into another one', () => {
    expect(getCategory('going_out').id).toBe('personal')
    expect(getCategory('health').label).toBe('Personales')
  })

  it('falls back to Otros for unknown categories', () => {
    expect(getCategory('crypto').id).toBe('other')
  })

  it('gives every built-in category a palette color', () => {
    for (const c of BUILT_IN_CATEGORIES) expect(c.color).toMatch(/^var\(--color-cat-\d\)$/)
  })

  it("finds the user's categories, with their icon and color", () => {
    setCustomCategories([custom('c1', 'Nafta')])

    const nafta = getCategory('c1')
    expect(nafta).toMatchObject({ id: 'c1', label: 'Nafta', color: 'var(--color-cat-2)' })
    expect(nafta.own?.icon).toBe('fuel')
  })

  it('shows a deleted one as Otros', () => {
    setCustomCategories([custom('c1', 'Nafta', { deleted: true })])

    expect(getCategory('c1').id).toBe(OTHER_ID)
  })
})

describe('built-in categories the user changed', () => {
  it('take the name and color of their row, keep their icon, and are not their own', () => {
    setCustomCategories([
      custom('r1', 'Supermercado', { builtIn: 'groceries', icon: '', color: 5 }),
    ])

    const groceries = getCategory('groceries')
    expect(groceries).toMatchObject({ label: 'Supermercado', color: 'var(--color-cat-5)' })
    expect(groceries.icon).toBe(BUILT_IN_CATEGORIES[0].icon)
    expect(groceries.own).toBeUndefined()
    expect(groceries.custom?.id).toBe('r1')
    // The row is no category of its own
    expect(getCategory('r1').id).toBe(OTHER_ID)
  })

  it('take the icon the user gave them', () => {
    setCustomCategories([custom('r1', 'Súper', { builtIn: 'groceries', icon: 'utensils' })])

    expect(getCategory('groceries').icon).toBe(CATEGORY_ICONS.utensils.icon)
  })

  it('take the latest row when two devices changed the same one', () => {
    setCustomCategories([
      custom('r1', 'Viejo', { builtIn: 'groceries', updatedAt: '2026-10-01T12:00:00Z' }),
      custom('r2', 'Nuevo', { builtIn: 'groceries', updatedAt: '2026-10-02T12:00:00Z' }),
    ])

    expect(getCategory('groceries').label).toBe('Nuevo')
  })

  it('go back to the original when their row is deleted', () => {
    setCustomCategories([custom('r1', 'Supermercado', { builtIn: 'groceries', deleted: true })])

    expect(getCategory('groceries').label).toBe('Súper')
    expect(getCategory('groceries').custom).toBeUndefined()
  })

  it('rename the fallback too, when it is Otros', () => {
    setCustomCategories([custom('r1', 'Varios', { builtIn: OTHER_ID })])

    expect(getCategory('crypto').label).toBe('Varios')
  })
})

describe('exact colors', () => {
  it("paint the user's own and the built-in ones over the palette's", () => {
    setCustomCategories([
      custom('c1', 'Nafta', { customColor: '#12ab34' }),
      custom('r1', 'Súper', { builtIn: 'groceries', customColor: '#ff00aa' }),
    ])

    expect(getCategory('c1').color).toBe('#12ab34')
    expect(getCategory('groceries').color).toContain('#ff00aa')
  })
})
