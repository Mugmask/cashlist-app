import type { ShoppingItem } from '@/lib/db'

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

// Key to detect the same product regardless of case, accents and spacing
export function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export interface Suggestion {
  name: string // as last written
  timesBought: number
}

// Products bought before and not already on the list, most frequent first
export function buyAgainSuggestions(items: readonly ShoppingItem[], limit: number): Suggestion[] {
  const onList = new Set(
    items.filter((i) => !i.deleted && i.status !== 'bought').map((i) => normalizeName(i.name)),
  )

  const history = new Map<string, { name: string; timesBought: number; lastBought: string }>()
  for (const item of items) {
    if (item.deleted || item.status !== 'bought') continue
    const key = normalizeName(item.name)
    if (onList.has(key)) continue
    const boughtAt = item.boughtAt ?? item.updatedAt
    const entry = history.get(key)
    if (!entry) {
      history.set(key, { name: item.name, timesBought: 1, lastBought: boughtAt })
      continue
    }
    entry.timesBought += 1
    if (boughtAt > entry.lastBought) {
      entry.lastBought = boughtAt
      entry.name = item.name
    }
  }

  return [...history.values()]
    .sort((a, b) => b.timesBought - a.timesBought || b.lastBought.localeCompare(a.lastBought))
    .slice(0, limit)
    .map(({ name, timesBought }) => ({ name, timesBought }))
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

// Groups the active list: to buy alphabetically (easy to scan), in cart most recent first
export function splitList(items: readonly ShoppingItem[]) {
  const active = items.filter((i) => !i.deleted)
  return {
    toBuy: active
      .filter((i) => i.status === 'to_buy')
      .sort((a, b) => collator.compare(a.name, b.name)),
    inCart: active
      .filter((i) => i.status === 'in_cart')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  }
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1)
}
