import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/ui'
import styles from './UpdatePrompt.module.css'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className={styles.toast} role="status">
      <span className={styles.text}>Hay una versión nueva.</span>
      <Button variant="ghost" onClick={() => setNeedRefresh(false)}>
        Después
      </Button>
      <Button onClick={() => updateServiceWorker(true)}>Actualizar</Button>
    </div>
  )
}
