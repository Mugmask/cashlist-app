import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from '../IconButton/IconButton'
import styles from './Sheet.module.css'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// Bottom sheet on top of the native <dialog>: focus trap, Esc and inert background come for free.
// Children only mount while open, so forms inside start fresh every time.
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click whose target is the dialog itself landed on the backdrop
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <div className={styles.content}>
          <div className={styles.handle} aria-hidden />
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <IconButton label="Cerrar" icon={<X />} onClick={onClose} />
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
