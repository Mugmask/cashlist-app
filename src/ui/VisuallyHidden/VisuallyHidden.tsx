import type { HTMLAttributes } from 'react'
import styles from './VisuallyHidden.module.css'

// Hidden on screen, still read by screen readers
export function VisuallyHidden({
  as: Tag = 'span',
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: 'span' | 'label' } & { htmlFor?: string }) {
  return <Tag className={styles.visuallyHidden} {...rest} />
}
