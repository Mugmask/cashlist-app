import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { runSync } from '@/lib/sync'
import { cx } from '@/ui'
import styles from './PullToRefresh.module.css'

const THRESHOLD = 70 // how far to pull (after the resistance) for a release to reload
const MAX_PULL = 110
const RESISTANCE = 0.5 // the indicator moves half what the finger does

// Installed, the app has no reload button nor the browser's pull-to-refresh
function isInstalled() {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// Pull down from the top of a screen and let go to reload the app, like a browser tab.
// It syncs first, so nothing pending is lost. Only in the installed app, never with a sheet
// open, and not while scrolling sideways (the rows of chips).
export function PullToRefresh() {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    if (!isInstalled()) return
    let start: { x: number; y: number } | null = null
    let distance = 0

    const reset = () => {
      start = null
      distance = 0
      setPull(0)
    }
    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0 || document.querySelector('dialog[open]')) return
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onMove = (e: TouchEvent) => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      // Up, sideways, or the page scrolled after all: not a pull
      if (dy <= 0 || Math.abs(dx) > dy || window.scrollY > 0) {
        if (distance > 0) reset()
        else start = null
        return
      }
      distance = Math.min(MAX_PULL, dy * RESISTANCE)
      setPull(distance)
      if (e.cancelable) e.preventDefault() // the page stays put while pulling
    }
    const onEnd = async () => {
      if (!start) return
      if (distance < THRESHOLD) return reset()
      start = null
      busy.current = true
      setRefreshing(true)
      await runSync().catch(() => {})
      window.location.reload()
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', reset)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', reset)
    }
  }, [])

  const shown = refreshing ? THRESHOLD : pull
  if (shown === 0) return null
  const ready = refreshing || pull >= THRESHOLD

  return (
    <div
      className={cx(styles.indicator, ready && styles.ready, refreshing && styles.refreshing)}
      style={
        {
          '--pull': `${shown}px`,
          '--turn': `${(shown / THRESHOLD) * 270}deg`,
        } as CSSProperties
      }
      role="status"
      aria-label={refreshing ? 'Actualizando' : ready ? 'Soltá para actualizar' : undefined}
    >
      <RefreshCw aria-hidden />
    </div>
  )
}
