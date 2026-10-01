import { useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../cx'
import styles from './OptionGrid.module.css'

export interface GridOption<T extends string | number> {
  value: T
  label: string // announced by screen readers and shown as a tooltip: the content is visual
  content: ReactNode
  style?: CSSProperties
}

export interface OptionGridProps<T extends string | number> {
  label: string
  options: readonly GridOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

const KEY_STEPS: Partial<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

// Single-select square tiles (icons, color swatches) with radio semantics, like ChipGroup
export function OptionGrid<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
}: OptionGridProps<T>) {
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
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.grid}>
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
              aria-label={option.label}
              title={option.label}
              tabIndex={checked ? 0 : -1}
              className={cx(styles.tile, checked && styles.checked)}
              style={option.style}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {option.content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
