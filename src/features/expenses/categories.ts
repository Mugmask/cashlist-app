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

// Stored as the id; label, icon and chart color are UI only. None is gray: every one has a
// hue of the validated palette. It has eight for nine categories, so Vivienda and Servicios
// share violet, which is also the fixed expenses' in charts (they almost always are one).
export const EXPENSE_CATEGORIES = [
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
] as const satisfies readonly { id: string; label: string; icon: LucideIcon; color: string }[]

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id']

const byId = new Map<string, (typeof EXPENSE_CATEGORIES)[number]>(
  EXPENSE_CATEGORIES.map((c) => [c.id, c]),
)

// Categories that were folded into another one; rows may still carry them until they sync
const MERGED: Record<string, ExpenseCategoryId> = { going_out: 'personal', health: 'personal' }

const OTHER = byId.get('other')!

// Falls back to "Otros" for categories this version doesn't know yet
export function getCategory(id: string) {
  return byId.get(MERGED[id] ?? id) ?? OTHER
}
