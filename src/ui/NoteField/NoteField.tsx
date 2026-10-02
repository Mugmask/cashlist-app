import { Plus } from 'lucide-react'
import { useState } from 'react'
import { TextField } from '../TextField/TextField'
import styles from './NoteField.module.css'

export interface NoteFieldProps {
  value: string
  onChange: (value: string) => void
}

// An optional note: a "+ Agregar nota" link until asked for, so a form that rarely needs one
// doesn't carry a field for it. With a note already there (editing, say), it shows as is.
export function NoteField({ value, onChange }: NoteFieldProps) {
  const [open, setOpen] = useState(value !== '')

  if (!open) {
    return (
      <button type="button" className={styles.add} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Agregar nota
      </button>
    )
  }
  return (
    <TextField
      label="Nota"
      hideLabel
      autoCapitalize="sentences"
      placeholder="Nota"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus={value === ''} // just asked for: straight to typing
    />
  )
}
