import { db, type CustomCategory } from '@/lib/db'
import { normalizeName } from '@/utils/text'
import type { Category } from './categories'
import { PICKABLE_COLORS } from './categoryIcons'

// customColor: an exact color over the palette's; left out (undefined), the palette's again
export type CategoryInput = Pick<CustomCategory, 'name' | 'icon' | 'color' | 'customColor'>

export const MAX_CATEGORY_NAME = 24 // a chip, a chart legend: little room

// Single entry point to the user's categories: components never touch Dexie directly.
// Deleting one doesn't touch its expenses: they show as "Otros" (getCategory's fallback).
export const categoriesRepo = {
  async create(data: CategoryInput, now = new Date()) {
    const id = crypto.randomUUID()
    await db.categories.add({
      ...data,
      id,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
    return id
  },

  async update(id: string, changes: CategoryInput, now = new Date()) {
    await db.categories.update(id, { ...changes, updatedAt: now.toISOString(), pending: 1 })
  },

  async remove(id: string, now = new Date()) {
    await db.categories.update(id, { deleted: true, updatedAt: now.toISOString(), pending: 1 })
  },

  get(id: string) {
    return db.categories.get(id)
  },

  // The user's name, icon and color for a built-in one: updates their row for it, or makes it
  async customizeBuiltIn(builtIn: Category, changes: CategoryInput, now = new Date()) {
    const { custom } = builtIn
    if (custom) {
      await db.categories.update(custom.id, {
        ...changes,
        deleted: false,
        updatedAt: now.toISOString(),
        pending: 1,
      })
      return
    }
    await db.categories.add({
      ...changes,
      id: crypto.randomUUID(),
      builtIn: builtIn.id,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  },

  // Back to the app's name, icon and color: every row for it goes (two devices may have made one)
  async resetBuiltIn(builtInId: string, now = new Date()) {
    const rows = await db.categories.filter((c) => c.builtIn === builtInId && !c.deleted).toArray()
    await Promise.all(rows.map((row) => categoriesRepo.remove(row.id, now)))
  },
}

// Another category already goes by this name ("Nafta" = "nafta "), other than `exceptId`
export function isNameTaken(name: string, categories: readonly Category[], exceptId?: string) {
  const key = normalizeName(name)
  return categories.some((c) => c.id !== exceptId && normalizeName(c.label) === key)
}

// A color for a new one: the palette in turn, so consecutive ones don't look alike
export function nextColor(categories: readonly Category[]) {
  const own = categories.filter((c) => c.own).length
  return PICKABLE_COLORS[own % PICKABLE_COLORS.length]
}
