import { useEffect } from 'react'
import { useLocation, useMatches, useNavigationType } from 'react-router'
import type { RouteHandle } from '../router'

const STORAGE_KEY = 'cashlist:history'

// What each history entry (by location key) was, and the entry it was opened from. In
// sessionStorage, like the browser's own history: a reload keeps it, a new tab starts clean.
interface Entry {
  title: string
  pathname: string
  href: string // with its search, so going back lands on the same filtered list
  from?: string // key of the previous entry
}

function load(): Record<string, Entry> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const entries = load()
// The entry shown last, to know where a push or replace comes from (one app, one history)
let lastKey: string | null = null

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Without storage the back link still works, it just forgets on reload
  }
}

export interface BackTarget {
  title: string
  href: string
  steps?: number // how far back in history it is; missing when it isn't in history
}

const HOME: BackTarget = { title: 'Inicio', href: '/' }

// The screen before this one, to go back to: the previous history entry with a different
// screen (narrowing a list or tapping its tab again doesn't count), or Inicio when the app
// was opened right here. Must run on every screen, so it sees every navigation.
export function useBackTarget(): BackTarget | null {
  const location = useLocation()
  const navigationType = useNavigationType()
  const matches = useMatches()
  const { key, pathname, search } = location

  const title =
    matches
      .map((m) => (m.handle as RouteHandle | undefined)?.title)
      .filter(Boolean)
      .at(-1) ?? ''

  // Where this entry came from: known if already seen; else, a push comes from the last one
  // and a replace takes the place of the last one
  const last = lastKey
  const from =
    entries[key]?.from ??
    (last === null || last === key
      ? undefined
      : navigationType === 'PUSH'
        ? last
        : navigationType === 'REPLACE'
          ? entries[last]?.from
          : undefined)

  useEffect(() => {
    entries[key] = { title, pathname, href: pathname + search, from }
    lastKey = key
    save()
  }, [key, title, pathname, search, from])

  if (pathname === '/') return null

  let steps = 1
  let target = from ? entries[from] : undefined
  while (target?.pathname === pathname) {
    steps++
    target = target.from ? entries[target.from] : undefined
  }
  return target ? { title: target.title, href: target.href, steps } : HOME
}
