import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../cx'
import styles from './ChipGroup.module.css'

export interface ChipOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface ChipGroupProps<T extends string> {
  label: string
  options: readonly ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  // Shows the label above the chips; otherwise it's only announced by screen readers
  showLabel?: boolean
  className?: string
}

const KEY_STEPS: Partial<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

// Single-select chips with radio semantics and arrow-key navigation
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  showLabel = false,
  className,
}: ChipGroupProps<T>) {
  const labelId = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(e: KeyboardEvent, index: number) {
    const step = KEY_STEPS[e.key]
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div className={cx(styles.wrapper, className)}>
      {showLabel && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        className={styles.group}
      >
        {options.map((option, index) => {
          const checked = option.value === value
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={cx(styles.chip, checked && styles.checked)}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {option.icon}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
