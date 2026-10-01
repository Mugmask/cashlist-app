import { describe, expect, it } from 'vitest'
import { EXPENSE_CATEGORIES, getCategory } from './categories'

describe('getCategory', () => {
  it('shows a folded category as the one it went into', () => {
    expect(getCategory('going_out').id).toBe('personal')
    expect(getCategory('health').label).toBe('Personales')
  })

  it('falls back to Otros for one it does not know', () => {
    expect(getCategory('crypto').id).toBe('other')
  })

  it('gives every category a hue, none gray', () => {
    for (const c of EXPENSE_CATEGORIES) expect(c.color).toMatch(/^var\(--color-cat-\d\)$/)
  })
})
