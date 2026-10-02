import { contrast, HEX_COLOR, mixWithWhite } from '@/utils/color'

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
}

const DEFAULT_ACCENT: Preset = 'green'
// Both also read by index.html
const STORAGE_KEY = 'cashlist:accent'
const CUSTOM_KEY = 'cashlist:accent-custom' // the last custom color, kept while on a preset

const BACKGROUND = '#0e1014' // tokens.css --color-bg: the app is dark-only
// What every accent holds against the background, like the presets: enough to stay >= 4.5:1
// (WCAG AA) on the cards, which its own glow makes lighter than the background
const ACCENT_CONTRAST = 7
const LIGHTEN_STEP = 0.05

function isAccent(value: unknown): value is Accent {
  return value === 'custom' || ACCENTS.some((accent) => accent.value === value)
}

// Whether the color, as picked, is too dark to read on the background: it gets lightened
export function needsLightening(color: string) {
  return contrast(color, BACKGROUND) < ACCENT_CONTRAST
}

// The picked color, lightened toward white just enough to read like the presets
export function readableAccent(color: string) {
  let shown = color
  for (let amount = LIGHTEN_STEP; needsLightening(shown) && amount <= 1; amount += LIGHTEN_STEP) {
    shown = mixWithWhite(color, amount)
  }
  return shown
}

export function customAccent(picked: string): CustomAccent {
  return { color: readableAccent(picked) }
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
// just until the app reloads. A custom color goes inline on <html>, over the presets.
export function applyAccent(accent: Preset): void
export function applyAccent(accent: 'custom', custom: CustomAccent): void
export function applyAccent(accent: Accent, custom?: CustomAccent) {
  const root = document.documentElement
  root.dataset.accent = accent
  if (custom) {
    root.style.setProperty('--color-accent', custom.color)
  } else {
    root.style.removeProperty('--color-accent')
  }
  try {
    localStorage.setItem(STORAGE_KEY, accent)
    if (custom) localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom))
  } catch {
    // not being able to remember it is harmless
  }
}
