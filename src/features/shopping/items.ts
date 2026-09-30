import type { ShoppingItem } from '@/lib/db'
import { capitalize } from '@/utils/text'

export const MAX_QUANTITY = 99

export interface ParsedItem {
  name: string
  quantity: number
}

const TRAILING_QTY = /^(.*?)\s*x\s*(\d+)$/i // "leche x2", "leche x 2"
const LEADING_QTY = /^(\d+)\s*x?\s+(.+)$/i // "2 leches", "2x leche"

// Reads what the user typed into a name and a quantity. Returns null for empty input.
export function parseItemInput(text: string): ParsedItem | null {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return null

  const trailing = clean.match(TRAILING_QTY)
  const leading = trailing ? null : clean.match(LEADING_QTY)
  const [rawName, rawQuantity] = trailing
    ? [trailing[1], trailing[2]]
    : leading
      ? [leading[2], leading[1]]
      : [clean, '1']

  const name = rawName.trim()
  const quantity = Number(rawQuantity)
  if (!name || quantity < 1) return null
  return { name: capitalize(name), quantity: Math.min(quantity, MAX_QUANTITY) }
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })
const byName = (a: ShoppingItem, b: ShoppingItem) => collator.compare(a.name, b.name)

// The list (to buy alphabetically, cart most recent first) and the whole pantry alphabetically
export function splitShopping(items: readonly ShoppingItem[]) {
  const active = items.filter((i) => !i.deleted)
  return {
    toBuy: active.filter((i) => i.status === 'to_buy').sort(byName),
    inCart: active
      .filter((i) => i.status === 'in_cart')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    pantry: [...active].sort(byName),
  }
}
