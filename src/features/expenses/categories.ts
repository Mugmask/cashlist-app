import {
  Bike,
  BusFront,
  HeartPulse,
  House,
  type LucideIcon,
  PartyPopper,
  Repeat,
  ShoppingCart,
  Tag,
  Zap,
} from 'lucide-react'

// Stored as the id; label and icon are UI only
export const EXPENSE_CATEGORIES = [
  { id: 'groceries', label: 'Súper', icon: ShoppingCart },
  { id: 'delivery', label: 'Delivery', icon: Bike },
  { id: 'rent', label: 'Vivienda', icon: House }, // rent, building fees
  { id: 'utilities', label: 'Servicios', icon: Zap },
  { id: 'transport', label: 'Transporte', icon: BusFront },
  { id: 'going_out', label: 'Salidas', icon: PartyPopper },
  { id: 'subscriptions', label: 'Suscripciones', icon: Repeat },
  { id: 'health', label: 'Salud', icon: HeartPulse },
  { id: 'other', label: 'Otros', icon: Tag },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[]

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id']

const byId = new Map<string, (typeof EXPENSE_CATEGORIES)[number]>(
  EXPENSE_CATEGORIES.map((c) => [c.id, c]),
)

const OTHER = byId.get('other')!

// Falls back to "Otros" for categories this version doesn't know yet
export function getCategory(id: string) {
  return byId.get(id) ?? OTHER
}
