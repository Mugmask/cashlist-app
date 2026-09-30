import { CircleAlert, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Alert.module.css'

export interface AlertProps {
  tone?: 'info' | 'danger'
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', children, className }: AlertProps) {
  const Icon = tone === 'danger' ? CircleAlert : Info
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(styles.alert, styles[tone], className)}
    >
      <Icon aria-hidden className={styles.icon} />
      <div>{children}</div>
    </div>
  )
}
