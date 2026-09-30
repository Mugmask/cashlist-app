import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../cx'
import styles from './SegmentedControl.module.css'

export interface Segment<T extends string> {
  value: T
  label: string
  count?: number
}

export interface SegmentedControlProps<T extends string> {
  label: string
  segments: readonly Segment<T>[]
  value: T
  onChange: (value: T) => void
}

// Tabs that switch views within a screen (ARIA tablist with arrow-key navigation)
export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + segments.length) % segments.length
    onChange(segments[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={styles.control}>
      {segments.map((segment, index) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.segment, selected && styles.selected)}
            onClick={() => onChange(segment.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {segment.label}
            {segment.count !== undefined && <span className={styles.count}>{segment.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
