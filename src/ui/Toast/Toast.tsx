import { CircleCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import { ToastContext, type ShowToast, type ToastAction } from './useToast'

const DURATION_MS = 3000
const WITH_ACTION_MS = 4000 // a bit longer, to reach the button

// Confirms that an action happened ("Gasto guardado"). Visible for a moment and announced by
// screen readers through a polite live region that is always mounted, so announcements
// aren't lost when the toast appears.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    id: number
    message: string
    action?: ToastAction
  } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback<ShowToast>((message, options) => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), message, action: options?.action })
    timer.current = setTimeout(() => setToast(null), options?.action ? WITH_ACTION_MS : DURATION_MS)
  }, [])

  function act(action: ToastAction) {
    clearTimeout(timer.current)
    setToast(null)
    action.onClick()
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" aria-atomic="true">
        {toast && (
          <div key={toast.id} className={styles.toast}>
            <CircleCheck aria-hidden className={styles.icon} />
            <span>{toast.message}</span>
            {toast.action && (
              <button type="button" className={styles.action} onClick={() => act(toast.action!)}>
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext>
  )
}
