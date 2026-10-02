import { contrast, HEX_COLOR } from '@/utils/color'
import { BACKGROUNDS, type Theme } from './theme'

// The app's accent color, picked in the profile: one of the presets (their colors live in
// tokens.css, [data-accent] themes) or any color the user chooses. Kept per device, like the
// screen it paints: index.html reads the same keys to set it before the first paint.
export const ACCENTS = [
  { value: 'green', label: 'Verde' },
  { value: 'cyan', label: 'Celeste' },
  { value: 'blue', label: 'Azul' },
  { value: 'violet', label: 'Violeta' },
  { value: 'pink', label: 'Rosa' },
  { value: 'orange', label: 'Naranja' },
] as const

export type Preset = (typeof ACCENTS)[number]['value']
export type Accent = Preset | 'custom'

export interface CustomAccent {
  color: string // #rrggbb
  on: string // text drawn on top of it: black or white, whichever reads better
}

const DEFAULT_ACCENT: Preset = 'green'
// Both also read by index.html
const STORAGE_KEY = 'cashlist:accent'
const CUSTOM_KEY = 'cashlist:accent-custom' // the last custom color, kept while on a preset

const ON_DARK = BACKGROUNDS.dark
const ON_LIGHT = '#ffffff'
// Below this against the background, the accent as text is hard to read (WCAG AA)
export const MIN_CONTRAST = 4.5

function isAccent(value: unknown): value is Accent {
  return value === 'custom' || ACCENTS.some((accent) => accent.value === value)
}

export function customAccent(color: string): CustomAccent {
  return { color, on: contrast(color, ON_DARK) >= contrast(color, ON_LIGHT) ? ON_DARK : ON_LIGHT }
}

// Whether the color reads well as text on the background of the theme on screen
export function readsOnBackground(color: string, theme: Theme) {
  return contrast(color, BACKGROUNDS[theme]) >= MIN_CONTRAST
}

export function readAccent(): Accent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'custom' && !readCustomAccent()) return DEFAULT_ACCENT
    return isAccent(stored) ? stored : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

export function readCustomAccent(): CustomAccent | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? 'null')
    const color = (stored as Partial<CustomAccent> | null)?.color
    return typeof color === 'string' && HEX_COLOR.test(color) ? customAccent(color) : null
  } catch {
    return null
  }
}

// Repaints the app now and remembers it. Without storage (private mode) it still applies,
// just until the app reloads. A custom color goes inline on <html>, over any theme.
export function applyAccent(accent: Preset): void
export function applyAccent(accent: 'custom', custom: CustomAccent): void
export function applyAccent(accent: Accent, custom?: CustomAccent) {
  const root = document.documentElement
  root.dataset.accent = accent
  if (custom) {
    root.style.setProperty('--color-accent', custom.color)
    root.style.setProperty('--color-on-accent', custom.on)
  } else {
    root.style.removeProperty('--color-accent')
    root.style.removeProperty('--color-on-accent')
  }
  try {
    localStorage.setItem(STORAGE_KEY, accent)
    if (custom) localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom))
  } catch {
    // not being able to remember it is harmless
  }
}
