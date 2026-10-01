import { db, type CustomCategory } from '@/lib/db'
import { normalizeName } from '@/utils/text'
import type { Category } from './categories'
import { CATEGORY_COLOR_COUNT } from './categoryIcons'

export type CategoryInput = Pick<CustomCategory, 'name' | 'icon' | 'color'>

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
}

// Another category already goes by this name ("Nafta" = "nafta "), other than `exceptId`
export function isNameTaken(name: string, categories: readonly Category[], exceptId?: string) {
  const key = normalizeName(name)
  return categories.some((c) => c.id !== exceptId && normalizeName(c.label) === key)
}

// A color for a new one: the palette in turn, so consecutive ones don't look alike
export function nextColor(categories: readonly Category[]) {
  const own = categories.filter((c) => c.own).length
  return (own % CATEGORY_COLOR_COUNT) + 1
}
