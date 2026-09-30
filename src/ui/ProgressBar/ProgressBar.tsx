import { cx } from '../cx'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  label: string
  value: number
  max: number
  // 'limit': amber near the max and red past it (budgets). 'accent': always accent (shares).
  tone?: 'limit' | 'accent'
  className?: string
}

const WARNING_RATIO = 0.8

export function ProgressBar({ label, value, max, tone = 'limit', className }: ProgressBarProps) {
  const ratio = max > 0 ? value / max : 0
  const color =
    tone === 'accent' || ratio < WARNING_RATIO ? 'accent' : ratio >= 1 ? 'danger' : 'warning'

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cx(styles.track, className)}
    >
      <div
        className={cx(styles.fill, styles[color])}
        style={{ transform: `scaleX(${Math.min(ratio, 1)})` }}
      />
    </div>
  )
}
