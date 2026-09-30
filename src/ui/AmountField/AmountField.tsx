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
  symbol?: string // "$" (pesos) by default; "US$" for dollars
}

const PLACEHOLDER = '0'

// Big amount input, the hero of any "add money" form. It groups thousands while typing and
// shrinks the font as the number grows so it never overflows. The digits stay exactly
// centered: the input is sized by an invisible copy of its own text (not estimated), and an
// invisible "$" on the right balances the visible one on the left.
export function AmountField({
  label,
  value,
  onValueChange,
  symbol = '$',
  id,
  className,
  ...rest
}: AmountFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const shown = value || PLACEHOLDER

  return (
    <div
      className={cx(styles.field, className)}
      // Both symbols take room too: about two characters per "$" at the symbol's smaller size
      style={{ '--amount-chars': shown.length + 2 * symbol.length + 2 } as CSSProperties}
    >
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      <span className={styles.currency} aria-hidden>
        {symbol}
      </span>
      <span className={styles.sizer} data-value={shown}>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          // An <input> is ~20 characters wide by default, which would override the sizer's width
          size={1}
          placeholder={PLACEHOLDER}
          className={styles.input}
          value={value}
          onChange={(e) => onValueChange(formatAmountInput(e.target.value))}
          {...rest}
        />
      </span>
      <span className={cx(styles.currency, styles.balance)} aria-hidden>
        {symbol}
      </span>
    </div>
  )
}
