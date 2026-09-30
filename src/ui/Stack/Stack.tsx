import type { CSSProperties, HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Stack.module.css'

type Space = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Space
  direction?: 'column' | 'row'
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
}

// Lays out children with a gap from the spacing scale
export function Stack({
  gap = 4,
  direction = 'column',
  align,
  justify,
  className,
  style,
  ...rest
}: StackProps) {
  return (
    <div
      className={cx(styles.stack, className)}
      style={{
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap: `var(--space-${gap})`,
        ...style,
      }}
      {...rest}
    />
  )
}
