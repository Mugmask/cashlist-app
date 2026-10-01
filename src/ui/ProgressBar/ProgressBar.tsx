import { cx } from '../cx'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  label: string
  value: number
  max: number
  // 'limit': amber near the max and red past it (caps). 'accent': always accent (shares).
  tone?: 'limit' | 'accent'
  color?: string // with tone 'accent': a hue of its own (a category's) instead of the accent
  className?: string
}

const WARNING_RATIO = 0.8

export function ProgressBar({
  label,
  value,
  max,
  tone = 'limit',
  color: hue,
  className,
}: ProgressBarProps) {
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
      // Raw numbers ("98950 of 167750") mean nothing read aloud; the percentage does
      aria-valuetext={`${Math.round(ratio * 100)}%`}
      className={cx(styles.track, className)}
    >
      <div
        className={cx(styles.fill, !(tone === 'accent' && hue) && styles[color])}
        style={{
          transform: `scaleX(${Math.min(ratio, 1)})`,
          ...(tone === 'accent' && hue && { background: hue }),
        }}
      />
    </div>
  )
}
