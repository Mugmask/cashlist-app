import type { ReactNode } from 'react'
import { cx } from '@/ui'
import { Brand } from '../layout/Brand'
import styles from './StatusScreen.module.css'

export interface StatusScreenProps {
  code: string
  title: string
  description: string
  actions: ReactNode
  // Technical detail, only rendered in development
  details?: string
  // Takes the whole viewport (with the brand) when there's no app shell around it
  fullScreen?: boolean
}

export function StatusScreen({
  code,
  title,
  description,
  actions,
  details,
  fullScreen = false,
}: StatusScreenProps) {
  return (
    <div className={cx(styles.screen, fullScreen && styles.fullScreen)}>
      {fullScreen && (
        <header className={styles.brand}>
          <Brand />
        </header>
      )}
      <div className={styles.body}>
        <p className={styles.code} aria-hidden>
          {code}
        </p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>{actions}</div>
        {import.meta.env.DEV && details && (
          <details className={styles.details}>
            <summary>Detalle técnico (solo en desarrollo)</summary>
            <pre>{details}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
