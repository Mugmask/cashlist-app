import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { BUILT_IN_CATEGORIES, getCategory, setCustomCategories } from './categories'
import { categoriesRepo, isNameTaken, nextColor } from './categoriesRepo'
import { CATEGORY_ICONS } from './categoryIcons'

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
  it('goes through the pickable colors in turn, skipping green', () => {
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
    expect(nextColor([...BUILT_IN_CATEGORIES, ...own.slice(0, 5)])).toBe(7)
    expect(nextColor([...BUILT_IN_CATEGORIES, ...own.slice(0, 7)])).toBe(1)
  })
})

describe('customizing a built-in category', () => {
  const groceries = () => getCategory('groceries')

  async function load() {
    setCustomCategories(await db.categories.toArray())
  }

  it('stores a row for it pending upload, then updates that same row', async () => {
    const now = new Date('2026-10-02T12:00:00Z')
    await categoriesRepo.customizeBuiltIn(
      groceries(),
      { name: 'Supermercado', icon: 'cart', color: 5 },
      now,
    )
    await load()

    const [row] = await db.categories.toArray()
    expect(row).toMatchObject({
      name: 'Supermercado',
      color: 5,
      builtIn: 'groceries',
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
    expect(groceries().label).toBe('Supermercado')

    await categoriesRepo.customizeBuiltIn(groceries(), {
      name: 'Chino',
      icon: 'utensils',
      color: 2,
    })
    await load()

    expect(await db.categories.count()).toBe(1)
    expect(groceries()).toMatchObject({ label: 'Chino', color: 'var(--color-cat-2)' })
    expect(groceries().icon).toBe(CATEGORY_ICONS.utensils.icon)
  })

  it('reset deletes every row for it (soft, so it syncs) and brings the original back', async () => {
    await categoriesRepo.customizeBuiltIn(groceries(), {
      name: 'Supermercado',
      icon: 'cart',
      color: 5,
    })
    // A second device's row for the same one
    await db.categories.add({
      id: 'other-device',
      name: 'Chino',
      icon: '',
      color: 2,
      builtIn: 'groceries',
      updatedAt: '2026-10-01T00:00:00Z',
      deleted: false,
      pending: 0,
    })

    await categoriesRepo.resetBuiltIn('groceries')
    await load()

    const rows = await db.categories.toArray()
    expect(rows.every((r) => r.deleted && r.pending === 1)).toBe(true)
    expect(groceries()).toMatchObject({ label: 'Súper', color: 'var(--color-cat-1)' })
  })
})
