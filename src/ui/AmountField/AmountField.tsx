import { ArrowLeftRight } from 'lucide-react'
import { useId, type CSSProperties, type InputHTMLAttributes } from 'react'
import { amountInputChange } from '@/utils/currency'
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
  // Makes the symbol a button that switches the currency: "$ ⇄", tapped, becomes "US$ ⇄"
  switchCurrency?: { label: string; onSwitch: () => void } // label: "Cambiar a dólares"
}

const PLACEHOLDER = '0'

// Big amount input, the hero of any "add money" form. It groups thousands while typing and
// shrinks the font as the number grows so it never overflows. The digits stay exactly
// centered: the input is sized by an invisible copy of its own text (not estimated), and an
// invisible "$" on the right balances the visible one on the left (a button, when the symbol
// switches the currency: the copy on the right is the same button, hidden).
export function AmountField({
  label,
  value,
  onValueChange,
  symbol = '$',
  switchCurrency,
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
      // (the switch's icon, about one more each)
      style={
        {
          '--amount-chars': shown.length + 2 * symbol.length + 2 + (switchCurrency ? 2 : 0),
        } as CSSProperties
      }
    >
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      {switchCurrency ? (
        <button
          type="button"
          className={cx(styles.currency, styles.switch)}
          aria-label={switchCurrency.label}
          onClick={switchCurrency.onSwitch}
        >
          {symbol}
          <ArrowLeftRight aria-hidden />
        </button>
      ) : (
        <span className={styles.currency} aria-hidden>
          {symbol}
        </span>
      )}
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
          onChange={(e) => onValueChange(amountInputChange(value, e.target.value))}
          data-autofocus={rest.autoFocus || undefined} // see Sheet
          {...rest}
        />
      </span>
      <span
        className={cx(styles.currency, styles.balance, switchCurrency && styles.switch)}
        aria-hidden
      >
        {symbol}
        {switchCurrency && <ArrowLeftRight />}
      </span>
    </div>
  )
}
