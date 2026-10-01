import type { CSSProperties } from 'react'
import {
  type Currency,
  formatCurrency,
  formatCurrencyCompact,
  splitCurrency,
} from '@/utils/currency'
import { cx } from '../cx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden'
import styles from './Amount.module.css'
import { useCountUp } from './useCountUp'

export interface AmountProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'default' | 'muted' | 'accent' | 'danger'
  currency?: Currency // pesos by default
  // From this absolute value on, abbreviate ("$ 38,9 M"). For tight spots like stat tiles.
  compactFrom?: number
  // Counts up to the value when it appears or changes. On by default for the big sizes.
  animate?: boolean
  className?: string
}

const FRACTION_SCALE = 0.6 // must match .fraction font-size (the 0.6em part)

// Money display: "$ 12.500" prominent, cents smaller and only when there are any (",50").
// ",00" everywhere is noise. The lg/xl sizes shrink to fit their
// container (see Amount.module.css), so long amounts never overflow.
export function Amount({
  value,
  size = 'md',
  tone = 'default',
  compactFrom,
  currency = 'ARS',
  animate = size === 'lg' || size === 'xl',
  className,
}: AmountProps) {
  const shown = useCountUp(value, animate)
  // "$ 38,9 M" is pesos only; dollar amounts are never that big here
  const compact = currency === 'ARS' && compactFrom !== undefined && Math.abs(value) >= compactFrom
  const parts = (n: number) =>
    compact
      ? { whole: formatCurrencyCompact(n), fraction: '' }
      : withoutZeroCents(splitCurrency(n, currency))
  const { whole, fraction } = parts(shown)
  // Sized by the final value, so the font doesn't change size while counting up
  const final = parts(value)
  const chars = final.whole.length + final.fraction.length * FRACTION_SCALE

  return (
    <span
      className={cx(styles.amount, styles[size], styles[tone], className)}
      style={{ '--amount-chars': chars } as CSSProperties}
    >
      <span aria-hidden>
        {whole}
        {fraction && <span className={styles.fraction}>{fraction}</span>}
      </span>
      <VisuallyHidden>{formatCurrency(value, currency)}</VisuallyHidden>
    </span>
  )
}

function withoutZeroCents(parts: { whole: string; fraction: string }) {
  return /^,0+$/.test(parts.fraction) ? { ...parts, fraction: '' } : parts
}
