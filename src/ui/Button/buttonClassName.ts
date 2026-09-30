import { cx } from '../cx'
import styles from './Button.module.css'

export interface ButtonStyleOptions {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
  fullWidth?: boolean
}

// Button look for other elements, e.g. a router <Link>, without ui/ depending on the router
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}) {
  return cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth)
}
