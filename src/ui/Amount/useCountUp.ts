import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 400

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// The number to show while `value` is reached: from 0 when it first appears, from the old
// value when it changes. Whole numbers on the way, the exact value at the end. Without
// animation (disabled, or reduced motion), just the value.
export function useCountUp(value: number, enabled: boolean) {
  const animated = enabled && !prefersReducedMotion()
  const [shown, setShown] = useState(animated ? 0 : value)
  const from = useRef(shown)

  useEffect(() => {
    if (!animated) {
      from.current = value
      return
    }
    const start = from.current
    if (start === value) return
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min((now - startedAt) / DURATION_MS, 1)
      const current = t === 1 ? value : Math.round(start + (value - start) * easeOutCubic(t))
      from.current = current // interrupted by a new value: it goes on from here
      setShown(current)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [value, animated])

  return animated ? shown : value
}
