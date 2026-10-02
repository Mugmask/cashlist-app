import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cx } from '../cx'
import { IconButton } from '../IconButton/IconButton'
import styles from './Sheet.module.css'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// In case animationend never comes (a hidden tab, say): the closing animation's own length,
// plus a margin
const FALLBACK_MARGIN_MS = 100

function animationMs(el: Element) {
  return parseFloat(getComputedStyle(el).animationDuration) * 1000 || 0
}

// Bottom sheet on top of the native <dialog>: focus trap, Esc and inert background come for free.
// It slides up to open and down to close; children stay mounted until it's gone, and mount
// fresh every time it opens, so forms inside start over.
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // The content outlives `open` while the sheet slides down: closing is closed but still there
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const closing = !open && mounted

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (!dialog.open) return

    let done = false
    const finish = () => {
      if (done) return
      done = true
      dialog.close()
      setMounted(false)
    }
    const onEnd = (e: AnimationEvent) => e.target === dialog && finish()
    dialog.addEventListener('animationend', onEnd)
    // Read once the closing class is on, on the next frame
    let fallback: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      fallback = setTimeout(finish, animationMs(dialog) + FALLBACK_MARGIN_MS)
    })
    return () => {
      dialog.removeEventListener('animationend', onEnd)
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
      // Reopened mid-way: it just slides back up
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={cx(styles.sheet, closing && styles.closing)}
      aria-labelledby={titleId}
      // Esc: closes through the parent, so it slides down like every other way out. React
      // passes a nested sheet's cancel/close up to the sheets around it (even through a
      // portal), so each one only answers to its own: else closing an inner sheet would
      // close the one it was opened from, and lose what was being typed there.
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        onClose()
      }}
      onClose={(e) => e.target === e.currentTarget && open && onClose()}
      // A click whose target is the dialog itself landed on the backdrop
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {(open || mounted) && (
        // Sliding down it still shows, but takes no taps: a second tap on "Guardar" would
        // save twice
        <div className={styles.content} inert={closing}>
          {/* Stays put: only the body below scrolls */}
          <div className={styles.top}>
            <div className={styles.handle} aria-hidden />
            <header className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              <IconButton label="Cerrar" icon={<X />} onClick={onClose} />
            </header>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </dialog>
  )
}
