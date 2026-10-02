import type { ReactNode } from 'react'
import styles from './StickyActions.module.css'

// A form's buttons. Inside a sheet they stay in sight at its bottom while the form scrolls
// under them, so saving never needs a scroll first; anywhere else they sit in the flow.
export function StickyActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
