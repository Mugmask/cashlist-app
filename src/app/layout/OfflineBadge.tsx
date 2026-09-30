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
// A status region, so screen readers hear it when the connection drops.
export function OfflineBadge() {
  const online = useSyncExternalStore(subscribe, isOnline)

  return (
    <div role="status" className={styles.slot}>
      {!online && (
        <span className={styles.badge}>
          <CloudOff aria-hidden />
          Sin conexión
          <VisuallyHidden>
            . Lo que cargues se guarda en este dispositivo y se sube cuando vuelva.
          </VisuallyHidden>
        </span>
      )}
    </div>
  )
}
