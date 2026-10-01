import { afterEach, describe, expect, it } from 'vitest'
import type { CustomCategory } from '@/lib/db'
import { BUILT_IN_CATEGORIES, getCategory, OTHER_ID, setCustomCategories } from './categories'

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
