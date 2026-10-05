import type { ShoppingItem } from '@/lib/db'
import { normalizeName } from '@/utils/text'

// The store's sections, in the order a supermarket is usually walked: the list follows it
export const AISLES = [
  { id: 'produce', label: 'Verdulería' },
  { id: 'bakery', label: 'Panadería' },
  { id: 'meat', label: 'Carnicería y pescadería' },
  { id: 'dairy', label: 'Lácteos y fiambres' },
  { id: 'pantry', label: 'Almacén' },
  { id: 'drinks', label: 'Bebidas' },
  { id: 'frozen', label: 'Congelados' },
  { id: 'cleaning', label: 'Limpieza' },
  { id: 'personal', label: 'Perfumería' },
  { id: 'other', label: 'Otros' },
] as const

export type AisleId = (typeof AISLES)[number]['id']

const AISLE_IDS = new Set<string>(AISLES.map((a) => a.id))

// Names read without accents or case. A phrase matches anywhere in the name and is checked
// before single words, so "pan rallado" isn't bakery nor "papas fritas" produce. A word matches
// the start of a word of the name ("tomat" → tomates); one starting with "=" only matches whole,
// for the short ones ("=sal" isn't salame nor salsa). The name's first word that matches
// decides: "jugo de naranja" is a drink, not produce.
const PHRASES: Record<string, AisleId> = {
  'pan rallado': 'pantry',
  'papas fritas': 'pantry',
  'pure de tomate': 'pantry',
  'tomate triturado': 'pantry',
  'tomate perita': 'pantry',
  'dulce de leche': 'dairy',
  'crema de leche': 'dairy',
  'tapas de tarta': 'dairy',
  'tapas de empanada': 'dairy',
  'papel higienico': 'personal',
  'pasta de dientes': 'personal',
  'jabon en polvo': 'cleaning',
  'jabon liquido para ropa': 'cleaning',
  'papel de cocina': 'cleaning',
  'rollo de cocina': 'cleaning',
  'papel aluminio': 'cleaning',
  'mate cocido': 'pantry',
  'crema dental': 'personal',
  'desodorante de ambiente': 'cleaning',
}

const WORDS: Record<AisleId, string[]> = {
  produce: [
    'tomat',
    'papa',
    'batata',
    'cebolla',
    'verdeo',
    '=ajo',
    '=ajos',
    'lechuga',
    'zanahoria',
    'zapall',
    'berenjena',
    'morron',
    'pimiento',
    'acelga',
    'espinaca',
    'rucula',
    'palta',
    'banana',
    'manzana',
    'naranja',
    'mandarina',
    'limon',
    'pera',
    'frutilla',
    '=uva',
    '=uvas',
    'kiwi',
    'durazno',
    'choclo',
    'brocoli',
    'coliflor',
    'pepino',
    'apio',
    'verdura',
    'fruta',
    'perejil',
    'albahaca',
    'champi',
    'hongo',
    'puerro',
    'remolacha',
    'anana',
    'melon',
    'sandia',
    'ciruela',
    'repollo',
    'radicheta',
    'cilantro',
    'jengibre',
  ],
  bakery: [
    '=pan',
    'panes',
    'lactal',
    'factura',
    'medialuna',
    'prepizza',
    'pizzeta',
    'tostada',
    'budin',
    'bizcocho',
    'baguette',
    'chipa',
    'grisin',
  ],
  meat: [
    'carne',
    'pollo',
    'milanesa',
    'bife',
    'asado',
    'picada',
    'chorizo',
    'morcilla',
    'cerdo',
    'bondiola',
    'matambre',
    'pechuga',
    'suprema',
    'muslo',
    'hamburguesa',
    'salchicha',
    'pescado',
    'merluza',
    'salmon',
    'nalga',
    'cuadril',
    'peceto',
    'vacio',
    'carre',
    'lomo',
    'osobuco',
    'entrana',
    'molleja',
    'langostino',
    'costilla',
  ],
  dairy: [
    'leche',
    'yogur',
    'queso',
    'manteca',
    'crema',
    'huevo',
    'jamon',
    'salame',
    'fiambre',
    'mortadela',
    'ricota',
    'muzzarella',
    'mozzarella',
    'postre',
    '=flan',
    'tapa',
    'tybo',
    'cremoso',
    'reggianito',
    'provoleta',
    'margarina',
    'salchichon',
    'leberwurst',
  ],
  pantry: [
    'arroz',
    'fideo',
    'harina',
    'azucar',
    '=sal',
    'aceite',
    'vinagre',
    'yerba',
    'cafe',
    '=te',
    'cacao',
    'galletit',
    'cereal',
    'avena',
    'lenteja',
    'poroto',
    'garbanzo',
    'atun',
    'arveja',
    'salsa',
    'mayonesa',
    'ketchup',
    'mostaza',
    'mermelada',
    'miel',
    'rebozador',
    'polenta',
    'oregano',
    'pimienta',
    'condimento',
    'caldo',
    'sopa',
    'conserva',
    'chocolate',
    'alfajor',
    'golosina',
    '=mani',
    'edulcorante',
    'levadura',
    'gelatina',
    'bizcochuelo',
    'snack',
    'aceituna',
    'pure',
    'ravioles',
    'noquis',
    'tallarines',
    'spaghetti',
    'tostadita',
  ],
  drinks: [
    'agua',
    'gaseosa',
    'coca',
    'sprite',
    'fanta',
    'pepsi',
    'jugo',
    'cerveza',
    'vino',
    'fernet',
    'soda',
    'sidra',
    'energizante',
    'aquarius',
    'levite',
    'tonica',
    'aperitivo',
    'whisky',
  ],
  frozen: ['helado', 'congelad', 'hielo', 'nugget', 'patitas', 'bastoncito', 'freezer'],
  cleaning: [
    'detergente',
    'lavandina',
    'suavizante',
    'esponja',
    'trapo',
    'rejilla',
    'limpiador',
    'desinfectante',
    'bolsa',
    'servilleta',
    'escoba',
    'insecticida',
    'fosforo',
    'film',
    'lavavajilla',
    'quitamancha',
    'aromatizante',
    'secador',
  ],
  personal: [
    'shampoo',
    'champu',
    'acondicionador',
    'jabon',
    'desodorante',
    'dentifrico',
    'cepillo',
    'toalla',
    'toallita',
    'panal',
    'algodon',
    'afeitar',
    'protector',
    'curita',
    'hisopo',
    'enjuague',
    'tampon',
    'preservativo',
  ],
  other: [],
}

// The section a product most likely goes in, from its name; 'other' when nothing matches
export function guessAisle(name: string): AisleId {
  const key = normalizeName(name)
  for (const [phrase, aisle] of Object.entries(PHRASES)) {
    if (key.includes(phrase)) return aisle
  }
  for (const word of key.split(' ')) {
    for (const { id } of AISLES) {
      const hit = WORDS[id].some((keyword) =>
        keyword.startsWith('=') ? word === keyword.slice(1) : word.startsWith(keyword),
      )
      if (hit) return id
    }
  }
  return 'other'
}

// The section a product goes in: the one the user picked, else the guess from its name
export function aisleOf(item: Pick<ShoppingItem, 'name' | 'aisle'>): AisleId {
  return item.aisle && AISLE_IDS.has(item.aisle) ? (item.aisle as AisleId) : guessAisle(item.name)
}

// The user's names for sections they renamed (the profile's), by section id
export type AisleNames = Readonly<Record<string, string>>

// A section's name: the user's for it, else the app's
export function aisleLabel(id: AisleId, names: AisleNames = {}) {
  return names[id]?.trim() || AISLES.find((a) => a.id === id)!.label
}

// Products by section, in the store's order; sections with nothing left out. Each keeps the
// order it was given.
export function groupByAisle<T extends Pick<ShoppingItem, 'name' | 'aisle'>>(
  items: readonly T[],
): { aisle: AisleId; items: T[] }[] {
  const groups = new Map<AisleId, T[]>()
  for (const item of items) {
    const aisle = aisleOf(item)
    groups.set(aisle, [...(groups.get(aisle) ?? []), item])
  }
  return AISLES.filter((a) => groups.has(a.id)).map((a) => ({
    aisle: a.id,
    items: groups.get(a.id)!,
  }))
}
