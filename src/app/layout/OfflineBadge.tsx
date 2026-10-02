import { CloudOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { VisuallyHidden } from '@/ui'
import styles from './OfflineBadge.module.css'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

const isOnline = () => navigator.onLine

// Everything keeps working offline; this only says why changes aren't reaching other devices.
// A small icon in the header, next to the profile; the full sentence is for screen readers,
// in a status region so they hear it when the connection drops.
export function OfflineBadge() {
  const online = useSyncExternalStore(subscribe, isOnline)

  return (
    <div role="status" className={styles.slot}>
      {!online && (
        <span className={styles.badge} title="Sin conexión">
          <CloudOff aria-hidden />
          <VisuallyHidden>
            Sin conexión. Lo que cargues se guarda en este dispositivo y se sube cuando vuelva.
          </VisuallyHidden>
        </span>
      )}
    </div>
  )
}
