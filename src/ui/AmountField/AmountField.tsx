import { useId, type InputHTMLAttributes } from 'react'
import { cx } from '../cx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden'
import styles from './AmountField.module.css'

export interface AmountFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'inputMode' | 'value'
> {
  label: string
  value: string
}

const PLACEHOLDER = '0'

// Big, centered amount input: the hero of any "add money" form.
// The input is as wide as its text, so "$" and the digits stay centered together.
export function AmountField({ label, value, id, className, style, ...rest }: AmountFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const chars = Math.max(value.length, PLACEHOLDER.length)

  return (
    <div className={cx(styles.field, className)}>
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
        style={{ width: `${chars + 0.5}ch`, ...style }}
        {...rest}
      />
    </div>
  )
}
