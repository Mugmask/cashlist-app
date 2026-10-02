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
  // After the chips, in their same flow: a button that isn't an option (Editar, say)
  after?: ReactNode
  // Lays the chips out in this many rows that don't wrap, each chip as wide as its text,
  // dealt in turn (1st, 3rd... on the first; 2nd, 4th... on the second), so the first ones
  // stay first. For a strip that scrolls sideways.
  rows?: number
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
  after,
  rows,
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

  const chips = options.map((option, index) => {
    const checked = option.value === value
    // Tab lands on the picked chip; with none picked (a value no option has), the first
    const focusable = checked || (index === 0 && !options.some((o) => o.value === value))
    return (
      <button
        key={option.value}
        ref={(el) => {
          refs.current[index] = el
        }}
        type="button"
        role="radio"
        aria-checked={checked}
        tabIndex={focusable ? 0 : -1}
        className={cx(styles.chip, checked && styles.checked)}
        onClick={() => onChange(option.value)}
        onKeyDown={(e) => handleKeyDown(e, index)}
      >
        {option.icon}
        {option.label}
      </button>
    )
  })

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
        className={rows ? styles.rows : styles.group}
      >
        {rows ? (
          Array.from({ length: rows }, (_, row) => (
            <div key={row} className={styles.row}>
              {chips.filter((_, index) => index % rows === row)}
              {/* In the row the next chip would have gone to */}
              {row === options.length % rows && after}
            </div>
          ))
        ) : (
          <>
            {chips}
            {after}
          </>
        )}
      </div>
    </div>
  )
}
