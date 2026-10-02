import { useSyncExternalStore } from 'react'

// Light or dark, picked in the profile. The colors live in tokens.css (:root is dark,
// [data-theme='light'] the light one); this only says which one is on. Kept per device:
// index.html reads the same key to set it before the first paint.
export const THEMES = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
] as const

export type Theme = (typeof THEMES)[number]['value']

// The app was dark-only: it stays dark unless the user picks otherwise
const DEFAULT_THEME: Theme = 'dark'
const STORAGE_KEY = 'cashlist:theme' // also read by index.html

// Each theme's --color-bg, for the browser's bar (meta theme-color); also in index.html
export const BACKGROUNDS: Record<Theme, string> = { dark: '#0a0b0d', light: '#e9edf3' }

function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme.value === value)
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

// Repaints the app now and remembers it. Without storage (private mode) it still applies,
// just until the app reloads.
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BACKGROUNDS[theme])
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // not being able to remember it is harmless
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

// The theme on screen right now
export function useCurrentTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme)
}
