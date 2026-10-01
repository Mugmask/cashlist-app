import {
  Baby,
  Beer,
  BookOpen,
  Briefcase,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  type LucideIcon,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Scissors,
  Shirt,
  Smartphone,
  Tag,
  Utensils,
  Wrench,
} from 'lucide-react'

// What a category the user makes can look like: a short list, so picking is quick. Stored as
// the key, so the icons can change without touching the data. The label is for screen readers.
export const CATEGORY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
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

export function categoryColor(index: number) {
  return `var(--color-cat-${index})`
}
