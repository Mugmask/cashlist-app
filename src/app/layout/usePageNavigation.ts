import { useEffect, useRef, type RefObject } from 'react'
import { useLocation, useMatches } from 'react-router'
import type { RouteHandle } from '../router'

const APP_NAME = 'Cashlist'
const MAX_FRAMES = 30 // pages render their heading once local data loads: a few frames at most

export function setDocumentTitle(title?: string) {
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
}

// The deepest route's title goes to the browser tab (and is what screen readers announce)
export function usePageTitle() {
  const matches = useMatches()
  const title = matches
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .filter(Boolean)
    .at(-1)

  useEffect(() => {
    setDocumentTitle(title)
  }, [title])
}

// After navigating, move focus to the new screen's heading: screen readers announce where you
// are, and keyboard users continue from the top of the content instead of the tab bar.
// The first render keeps the browser's default focus.
export function useFocusHeadingOnNavigate(container: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    let frame = 0
    let raf = 0
    const tryFocus = () => {
      const heading = container.current?.querySelector('h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      } else if (frame++ < MAX_FRAMES) {
        raf = requestAnimationFrame(tryFocus)
      }
    }
    tryFocus()
    return () => cancelAnimationFrame(raf)
  }, [pathname, container])
}
