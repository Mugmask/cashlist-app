import type { RecipeIngredient } from '@/lib/db'
import { normalizeName } from '@/utils/text'
import { MAX_QUANTITY, type ParsedItem } from './items'

// Adds an ingredient to a recipe's list. One already there ("papa" = "Papa") gets the count
// added instead of a second row, like the shopping list does.
export function withIngredient(
  ingredients: readonly RecipeIngredient[],
  { name, quantity }: ParsedItem,
): RecipeIngredient[] {
  const key = normalizeName(name)
  const index = ingredients.findIndex((i) => normalizeName(i.name) === key)
  if (index === -1) return [...ingredients, { name, quantity }]
  return ingredients.map((i, n) =>
    n === index ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY) } : i,
  )
}

const MAX_SUGGESTIONS = 4

// Products already known (bought or on the list) that go with what's typed, so a recipe uses
// the same names as the list. Leaves out the ones the recipe already has.
export function productSuggestions(
  products: readonly string[],
  typed: string,
  ingredients: readonly RecipeIngredient[],
): string[] {
  const query = normalizeName(typed)
  if (!query) return []
  const taken = new Set(ingredients.map((i) => normalizeName(i.name)))
  return products
    .filter((name) => {
      const key = normalizeName(name)
      return (
        !taken.has(key) && key !== query && key.split(' ').some((word) => word.startsWith(query))
      )
    })
    .sort(
      (a, b) =>
        Number(normalizeName(b).startsWith(query)) - Number(normalizeName(a).startsWith(query)) ||
        a.localeCompare(b, 'es'),
    )
    .slice(0, MAX_SUGGESTIONS)
}
