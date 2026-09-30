import { useId, type CSSProperties, type InputHTMLAttributes } from 'react'
import { formatAmountInput } from '@/utils/currency'
import { cx } from '../cx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden'
import styles from './AmountField.module.css'

export interface AmountFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'inputMode' | 'value' | 'onChange'
> {
  label: string
  // Formatted as typed ("12.500,5"); read it with parseAmount
  value: string
  onValueChange: (value: string) => void
}

const PLACEHOLDER = '0'

// Big, centered amount input: the hero of any "add money" form. It groups thousands while
// typing, is as wide as its text so "$" and the digits stay centered together, and shrinks
// the font as the number grows so it never overflows.
export function AmountField({
  label,
  value,
  onValueChange,
  id,
  className,
  style,
  ...rest
}: AmountFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const chars = Math.max(value.length, PLACEHOLDER.length)

  return (
    <div
      className={cx(styles.field, className)}
      // "$ " takes about two characters more
      style={{ '--amount-chars': chars + 2 } as CSSProperties}
    >
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      <span className={styles.currency} aria-hidden>
        $
      </span>
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={PLACEHOLDER}
        className={styles.input}
        value={value}
        onChange={(e) => onValueChange(formatAmountInput(e.target.value))}
        style={{ width: `${chars + 0.5}ch`, ...style }}
        {...rest}
      />
    </div>
  )
}
