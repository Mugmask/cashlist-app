import { ArrowDown, ArrowUp } from 'lucide-react'
import { cx, VisuallyHidden } from '@/ui'
import styles from './Change.module.css'

// "↑ 18%" against the month before. Spending more is the warning, spending less the good
// news; the arrow and the sign carry it too, never the color alone. Within ±10% it stays
// quiet (gray): that's noise, not news.
export function Change({ value, suffix }: { value: number | null | undefined; suffix?: string }) {
  if (value === null || value === undefined) return null
  const percent = Math.round(value * 100)
  if (percent === 0) return null
  const Arrow = percent > 0 ? ArrowUp : ArrowDown
  const tone = percent >= 10 ? styles.up : percent <= -10 ? styles.down : undefined
  return (
    <span className={cx(styles.change, tone)}>
      <Arrow aria-hidden />
      {Math.abs(percent)}%{suffix && <span className={styles.suffix}> {suffix}</span>}
      <VisuallyHidden>{percent > 0 ? ' más' : ' menos'}</VisuallyHidden>
    </span>
  )
}
