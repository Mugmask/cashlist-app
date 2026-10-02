import { liveQuery } from 'dexie'
import {
  ArrowLeftRight,
  Bike,
  BusFront,
  House,
  type LucideIcon,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Zap,
} from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { db, type CustomCategory } from '@/lib/db'
import { CATEGORY_ICONS, categoryColor, customCategoryColor } from './categoryIcons'

export interface Category {
  id: string
  label: string
  icon: LucideIcon
  color: string
  own?: CustomCategory // set when the user made it: it can be edited and deleted
  // Set on a built-in the user renamed or recolored: their row for it (it can be reset)
  custom?: CustomCategory
}

// Stored as the id; label, icon and chart color are UI only. None is gray: every one has a
// hue of the validated palette. It has eight for nine categories, so Vivienda and Servicios
// share violet, which is also the fixed expenses' in charts (they almost always are one).
export const BUILT_IN_CATEGORIES: readonly Category[] = [
  { id: 'groceries', label: 'Súper', icon: ShoppingCart, color: 'var(--color-cat-1)' },
  { id: 'delivery', label: 'Delivery', icon: Bike, color: 'var(--color-cat-2)' },
  { id: 'rent', label: 'Vivienda', icon: House, color: 'var(--color-cat-7)' }, // rent, fees
  { id: 'utilities', label: 'Servicios', icon: Zap, color: 'var(--color-cat-7)' },
  { id: 'transport', label: 'Transporte', icon: BusFront, color: 'var(--color-cat-6)' },
  { id: 'subscriptions', label: 'Suscripciones', icon: Repeat, color: 'var(--color-cat-5)' },
  // money sent to people
  { id: 'transfers', label: 'Transferencias', icon: ArrowLeftRight, color: 'var(--color-cat-4)' },
  // going out, clothes, health, treats: what's for oneself
  { id: 'personal', label: 'Personales', icon: ShoppingBag, color: 'var(--color-cat-8)' },
  { id: 'other', label: 'Otros', icon: Tag, color: 'var(--color-cat-3)' },
]

export const OTHER_ID = 'other'

// Categories that were folded into another one; rows may still carry them until they sync
const MERGED: Record<string, string> = { going_out: 'personal', health: 'personal' }

const collator = new Intl.Collator('es', { sensitivity: 'base' })

interface Categories {
  loaded: boolean // the user's ones were read from the local database
  list: readonly Category[] // built-in first, then the user's alphabetically, "Otros" last
  byId: ReadonlyMap<string, Category>
  other: Category // "Otros", with the user's name and color for it if they changed them
}

// The exact color the user picked, or the palette's
function colorOf(row: CustomCategory) {
  return row.customColor ? customCategoryColor(row.customColor) : categoryColor(row.color)
}

// The user's name and color for each built-in they changed. Two devices changing the same
// one offline leave two rows: the latest wins.
function builtInChanges(rows: readonly CustomCategory[]) {
  const latest = new Map<string, CustomCategory>()
  for (const row of rows) {
    if (!row.builtIn) continue
    const seen = latest.get(row.builtIn)
    if (!seen || row.updatedAt > seen.updatedAt) latest.set(row.builtIn, row)
  }
  return latest
}

function withChanges(category: Category, changes: ReadonlyMap<string, CustomCategory>) {
  const custom = changes.get(category.id)
  if (!custom || custom.deleted) return category
  // An icon of their own when they picked one; '' (rows from before icons could change)
  // keeps the app's
  const icon = CATEGORY_ICONS[custom.icon]?.icon ?? category.icon
  return { ...category, label: custom.name, icon, color: colorOf(custom), custom }
}

function build(custom: readonly CustomCategory[], loaded: boolean): Categories {
  const changes = builtInChanges(custom)
  const builtIn = BUILT_IN_CATEGORIES.map((c) => withChanges(c, changes))
  const other = builtIn.find((c) => c.id === OTHER_ID)!
  const own = custom
    .filter((c) => !c.deleted && !c.builtIn)
    .map((c): Category => ({
      id: c.id,
      label: c.name,
      icon: CATEGORY_ICONS[c.icon]?.icon ?? Tag,
      color: colorOf(c),
      own: c,
    }))
    .sort((a, b) => collator.compare(a.label, b.label))
  const list = [...builtIn.filter((c) => c !== other), ...own, other]
  return { loaded, list, other, byId: new Map(list.map((c) => [c.id, c])) }
}

// The categories live in one module-level store, so plain functions (totals, filters) can
// look them up too. Components read it with useCategories, which re-renders them on changes.
let current = build([], false)
const listeners = new Set<() => void>()
let subscription: { unsubscribe: () => void } | null = null

// Replaces the user's categories. The live query below calls it; tests can too.
export function setCustomCategories(custom: readonly CustomCategory[]) {
  current = build(custom, true)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  subscription ??= liveQuery(() => db.categories.toArray()).subscribe({
    next: setCustomCategories,
    error: (e: unknown) => console.error('Categories query failed', e),
  })
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    subscription?.unsubscribe()
    subscription = null
  }
}

// Every category, kept up to date. Until `loaded`, only the built-in ones.
export function useCategories() {
  return useSyncExternalStore(subscribe, () => current)
}

// Falls back to "Otros" for categories this device doesn't know (yet), or that were deleted
export function getCategory(id: string) {
  return current.byId.get(MERGED[id] ?? id) ?? current.other
}
