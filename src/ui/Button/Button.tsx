import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx'
import { Spinner } from '../Spinner/Spinner'
import { buttonClassName, type ButtonStyleOptions } from './buttonClassName'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant,
  size = 'md',
  fullWidth,
  loading = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClassName({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 20 : 16} /> : icon}
      {children}
    </button>
  )
}
