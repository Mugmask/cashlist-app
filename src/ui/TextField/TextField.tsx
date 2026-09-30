import { useId, type ComponentPropsWithRef } from 'react'
import { cx } from '../cx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden'
import styles from './TextField.module.css'

// ComponentPropsWithRef: in React 19 `ref` is a regular prop, forwarded to the <input>
export interface TextFieldProps extends ComponentPropsWithRef<'input'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string | null
}

export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`

  return (
    <div className={cx(styles.field, className)}>
      {hideLabel ? (
        <VisuallyHidden as="label" htmlFor={inputId}>
          {label}
        </VisuallyHidden>
      ) : (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cx(styles.input, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? hintId : undefined}
        {...rest}
      />
      {(error || hint) && (
        <p id={hintId} className={cx(styles.hint, error && styles.error)}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
