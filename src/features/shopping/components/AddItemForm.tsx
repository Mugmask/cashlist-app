import { Plus } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import { IconButton, TextField } from '@/ui'
import { parseItemInput } from '../items'
import { shoppingRepo } from '../shoppingRepo'
import styles from './AddItemForm.module.css'

export function AddItemForm() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseItemInput(text)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parsed) return
    await shoppingRepo.add(parsed)
    setText('')
    inputRef.current?.focus() // keep typing the next one
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        ref={inputRef}
        label="Agregar producto"
        hideLabel
        placeholder="Agregar… (ej: leche x2)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        enterKeyHint="done"
        autoComplete="off"
        className={styles.field}
      />
      <IconButton
        type="submit"
        label="Agregar"
        icon={<Plus />}
        variant="accent"
        disabled={!parsed}
      />
    </form>
  )
}
