import type { CSSProperties } from 'react'
import { cx } from '../cx'
import styles from './Skeleton.module.css'

export interface SkeletonProps {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  round?: boolean // a disc (an icon) instead of a rounded block
  className?: string
}

// A gray placeholder with a soft sheen, where something is about to show
export function Skeleton({ width = '100%', height = 16, round, className }: SkeletonProps) {
  return (
    <span
      className={cx(styles.skeleton, round && styles.round, className)}
      style={{ width, height }}
      aria-hidden
    />
  )
}
