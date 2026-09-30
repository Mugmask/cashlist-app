import type { HTMLAttributes } from 'react'
import { cx } from '../cx'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'form'
  padding?: 'none' | 'md' | 'lg'
}

export function Card({ as: Tag = 'div', padding = 'md', className, ...rest }: CardProps) {
  return <Tag className={cx(styles.card, styles[`padding-${padding}`], className)} {...rest} />
}
