import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './IconButton.module.css'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  // Required: icon-only buttons need an accessible name
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'secondary' | 'accent'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[variant], className)}
      {...rest}
    >
      {icon}
    </button>
  )
}
