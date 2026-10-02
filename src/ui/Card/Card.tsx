import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'form'
  padding?: 'none' | 'md' | 'lg'
  // 'hero': glow in two corners, for the headline card of a screen
  variant?: 'default' | 'hero'
  // A hero's glow: the accent, or red when its headline number is (a month gone over), so
  // the glow and the number agree
  glow?: 'accent' | 'danger'
}

export function Card({
  as: Tag = 'div',
  padding = 'md',
  variant = 'default',
  glow = 'accent',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cx(
        styles.card,
        styles[`padding-${padding}`],
        variant === 'hero' && styles.hero,
        variant === 'hero' && glow === 'danger' && styles.danger,
        className,
      )}
      {...rest}
    />
  )
}
