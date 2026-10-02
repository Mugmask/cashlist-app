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

const HEX = /^#[0-9a-f]{6}$/i

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// WCAG contrast ratio between two #rrggbb colors, 1 to 21
export function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
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
    return typeof color === 'string' && HEX.test(color) ? customAccent(color) : null
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
