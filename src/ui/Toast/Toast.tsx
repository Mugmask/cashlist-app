import { CircleCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import { ToastContext, type ShowToast, type ToastAction } from './useToast'

const DURATION_MS = 3000
// Long enough to reach the button with a keyboard or a screen reader (WCAG 2.2.1); it also
// waits while the pointer or the focus is on the toast
const WITH_ACTION_MS = 10000

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
  const duration = useRef(DURATION_MS)

  const start = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), duration.current)
  }, [])

  const show = useCallback<ShowToast>(
    (message, options) => {
      setToast({ id: Date.now(), message, action: options?.action })
      duration.current = options?.action ? WITH_ACTION_MS : DURATION_MS
      start()
    },
    [start],
  )

  // Held while someone is on it, and given its full time again when they leave
  const pause = () => clearTimeout(timer.current)

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
          <div
            key={toast.id}
            className={styles.toast}
            onPointerEnter={pause}
            onPointerLeave={start}
            onFocus={pause}
            onBlur={start}
          >
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
