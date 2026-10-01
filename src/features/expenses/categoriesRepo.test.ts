import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { BUILT_IN_CATEGORIES, getCategory, setCustomCategories } from './categories'
import { categoriesRepo, isNameTaken, nextColor } from './categoriesRepo'

beforeEach(async () => {
  await db.categories.clear()
  setCustomCategories([])
})

describe('categoriesRepo', () => {
  it('create stores a category pending upload', async () => {
    const now = new Date('2026-10-01T12:00:00Z')
    const id = await categoriesRepo.create({ name: 'Nafta', icon: 'fuel', color: 2 }, now)

    expect(await categoriesRepo.get(id)).toEqual({
      id,
      name: 'Nafta',
      icon: 'fuel',
      color: 2,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  })

  it('remove is a soft delete, so it syncs; its expenses show as Otros', async () => {
    const id = await categoriesRepo.create({ name: 'Nafta', icon: 'fuel', color: 2 })
    await categoriesRepo.remove(id)

    const stored = await categoriesRepo.get(id)
    expect(stored).toMatchObject({ deleted: true, pending: 1 })
    setCustomCategories([stored!])
    expect(getCategory(id).id).toBe('other')
  })
})

describe('isNameTaken', () => {
  it('compares ignoring case, accents and spaces, against built-in ones too', () => {
    expect(isNameTaken('súper ', BUILT_IN_CATEGORIES)).toBe(true)
    expect(isNameTaken('Nafta', BUILT_IN_CATEGORIES)).toBe(false)
  })

  it('ignores the category being edited', () => {
    expect(isNameTaken('Súper', BUILT_IN_CATEGORIES, 'groceries')).toBe(false)
  })
})

describe('nextColor', () => {
  it('goes through the palette in turn', () => {
    expect(nextColor(BUILT_IN_CATEGORIES)).toBe(1)
    const own = Array.from({ length: 8 }, (_, i) => ({
      ...BUILT_IN_CATEGORIES[0],
      id: `c${i}`,
      own: {
        id: `c${i}`,
        name: '',
        icon: 'tag',
        color: 1,
        updatedAt: '',
        deleted: false,
        pending: 0 as const,
      },
    }))
    expect(nextColor([...BUILT_IN_CATEGORIES, ...own.slice(0, 3)])).toBe(4)
    expect(nextColor([...BUILT_IN_CATEGORIES, ...own])).toBe(1)
  })
})
