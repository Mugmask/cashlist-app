import { formatCurrency, splitCurrency } from '@/utils/currency'
import { cx } from '../cx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden'
import styles from './Amount.module.css'

export interface AmountProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'default' | 'muted' | 'accent' | 'danger'
  className?: string
}

// Money display: "$ 12.500" prominent, ",00" smaller
export function Amount({ value, size = 'md', tone = 'default', className }: AmountProps) {
  const { whole, fraction } = splitCurrency(value)

  return (
    <span className={cx(styles.amount, styles[size], styles[tone], className)}>
      <span aria-hidden>
        {whole}
        <span className={styles.fraction}>{fraction}</span>
      </span>
      <VisuallyHidden>{formatCurrency(value)}</VisuallyHidden>
    </span>
  )
}
