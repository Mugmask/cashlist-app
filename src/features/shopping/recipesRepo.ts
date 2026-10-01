import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Recipe, type RecipeIngredient } from '@/lib/db'
import { shoppingRepo } from './shoppingRepo'

export type RecipeInput = Pick<Recipe, 'name' | 'ingredients'>

const collator = new Intl.Collator('es', { sensitivity: 'base' })

// Single entry point to recipes: components never touch Dexie directly
export const recipesRepo = {
  async create(data: RecipeInput, now = new Date()) {
    const id = crypto.randomUUID()
    await db.recipes.add({
      ...data,
      id,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
    return id
  },

  async update(id: string, changes: RecipeInput, now = new Date()) {
    await db.recipes.update(id, { ...changes, updatedAt: now.toISOString(), pending: 1 })
  },

  async remove(id: string, now = new Date()) {
    await db.recipes.update(id, { deleted: true, updatedAt: now.toISOString(), pending: 1 })
  },

  // Non-deleted recipes, alphabetically
  async all() {
    const recipes = await db.recipes.filter((r) => !r.deleted).toArray()
    return recipes.sort((a, b) => collator.compare(a.name, b.name))
  },

  // Cooking it: what's missing goes on the shopping list, each like typed in ("Papa x4"),
  // so one already there gets the count added. Returns how many went.
  async cook(missing: readonly RecipeIngredient[], now = new Date()) {
    for (const ingredient of missing) await shoppingRepo.add(ingredient, now)
    return missing.length
  },
}

// undefined while loading; updates whenever a recipe changes
export function useRecipes() {
  return useLiveQuery(() => recipesRepo.all())
}
