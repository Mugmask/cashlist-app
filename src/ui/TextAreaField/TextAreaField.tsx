import { useId, type ComponentPropsWithRef } from 'react'
import { cx } from '../cx'
import styles from './TextAreaField.module.css'

export interface TextAreaFieldProps extends ComponentPropsWithRef<'textarea'> {
  label: string
  hint?: string
}

// TextField's look for text that runs to a few lines (a CBU, an address): it grows with what's
// written, up to a cap, instead of cutting it off on one line
export function TextAreaField({
  label,
  hint,
  id,
  className,
  rows = 2,
  ...rest
}: TextAreaFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        className={styles.input}
        aria-describedby={hint ? hintId : undefined}
        {...rest}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
