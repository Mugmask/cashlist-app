import {
  ArrowLeftRight,
  Baby,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  BusFront,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  type LucideIcon,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Repeat,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'

// What a category can look like: a short list, so picking is quick. The built-in ones' icons
// come first, so they can be picked for any category and a built-in one opens on its own.
// Stored as the key, so the icons can change without touching the data. The label is for
// screen readers.
export const CATEGORY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  cart: { icon: ShoppingCart, label: 'Súper' },
  bike: { icon: Bike, label: 'Delivery' },
  house: { icon: House, label: 'Casa' },
  bolt: { icon: Zap, label: 'Servicios' },
  bus: { icon: BusFront, label: 'Transporte' },
  repeat: { icon: Repeat, label: 'Suscripciones' },
  transfer: { icon: ArrowLeftRight, label: 'Transferencias' },
  bag: { icon: ShoppingBag, label: 'Compras' },
  tag: { icon: Tag, label: 'Etiqueta' },
  fuel: { icon: Fuel, label: 'Nafta' },
  car: { icon: Car, label: 'Auto' },
  plane: { icon: Plane, label: 'Viajes' },
  utensils: { icon: Utensils, label: 'Comida' },
  coffee: { icon: Coffee, label: 'Café' },
  beer: { icon: Beer, label: 'Salidas' },
  film: { icon: Clapperboard, label: 'Cine' },
  music: { icon: Music, label: 'Música' },
  gamepad: { icon: Gamepad2, label: 'Juegos' },
  book: { icon: BookOpen, label: 'Libros' },
  school: { icon: GraduationCap, label: 'Estudio' },
  work: { icon: Briefcase, label: 'Trabajo' },
  health: { icon: HeartPulse, label: 'Salud' },
  pill: { icon: Pill, label: 'Farmacia' },
  gym: { icon: Dumbbell, label: 'Gimnasio' },
  pet: { icon: PawPrint, label: 'Mascotas' },
  baby: { icon: Baby, label: 'Hijos' },
  clothes: { icon: Shirt, label: 'Ropa' },
  haircut: { icon: Scissors, label: 'Peluquería' },
  phone: { icon: Smartphone, label: 'Celular' },
  repairs: { icon: Wrench, label: 'Arreglos' },
  gift: { icon: Gift, label: 'Regalos' },
  savings: { icon: PiggyBank, label: 'Ahorro' },
}

export const DEFAULT_ICON = 'tag'

// The chart palette: every category color is one of these, so charts stay readable
export const CATEGORY_COLOR_COUNT = 8

// The ones offered when picking: all but green (6), the hardest to tell from aqua (3) and the
// app's own green. Seven plus "Personalizado" fit one row. Those already green keep it.
export const PICKABLE_COLORS = [1, 2, 3, 4, 5, 7, 8] as const

// The key of an icon in CATEGORY_ICONS, from the icon itself (a built-in one's)
export function iconKeyOf(icon: LucideIcon) {
  return (
    Object.entries(CATEGORY_ICONS).find(([, entry]) => entry.icon === icon)?.[0] ?? DEFAULT_ICON
  )
}

export function categoryColor(index: number) {
  return `var(--color-cat-${index})`
}

// An exact color the user picked. Shown as is on the dark theme; a step darker on the light
// one (--custom-color-strength), the way the palette's hues are, so it isn't washed out there
export function customCategoryColor(hex: string) {
  return `color-mix(in srgb, ${hex} var(--custom-color-strength), black)`
}

const CUSTOM_COLOR_STRENGTH_LIGHT = 0.82 // tokens.css --custom-color-strength, light theme

// What a custom color looks like on the theme on screen: the same mix, done here
export function shownCustomColor(hex: string, theme: 'dark' | 'light') {
  if (theme === 'dark') return hex
  const channel = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * CUSTOM_COLOR_STRENGTH_LIGHT)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

// The palette index back from a color categoryColor made: the built-ins are stored that way
export function colorIndexOf(color: string) {
  return Number(/--color-cat-(\d+)/.exec(color)?.[1] ?? 1)
}
