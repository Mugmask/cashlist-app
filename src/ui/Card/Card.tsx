import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'form'
  padding?: 'none' | 'md' | 'lg'
  // 'hero': accent glow for the headline card of a screen
  variant?: 'default' | 'hero'
}

export function Card({
  as: Tag = 'div',
  padding = 'md',
  variant = 'default',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cx(
        styles.card,
        styles[`padding-${padding}`],
        variant === 'hero' && styles.hero,
        className,
      )}
      {...rest}
    />
  )
}
