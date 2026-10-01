import { Plus } from 'lucide-react'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { runSync } from '@/lib/sync'
import { IconButton, TextField, useToast } from '@/ui'
import { parseItemInput } from '../items'
import { shoppingRepo, type AddResult } from '../shoppingRepo'
import styles from './AddItemForm.module.css'

const LABEL = 'Agregar a la lista'

// Puts a product on the list ("leche x2"). `inputRef` lets the page focus the field (the bottom
// nav's + on this screen). Adding one already there says so instead of silently doing it.
export function AddItemForm({
  inputRef: outerRef,
}: {
  inputRef?: RefObject<HTMLInputElement | null>
}) {
  const [text, setText] = useState('')
  const ownRef = useRef<HTMLInputElement>(null)
  const inputRef = outerRef ?? ownRef
  const toast = useToast()
  const parsed = parseItemInput(text)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parsed) return
    const result = await shoppingRepo.add(parsed)
    if (result.outcome === 'more') toast(alreadyThere(result))
    setText('')
    inputRef.current?.focus() // keep typing the next one
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        ref={inputRef}
        label={LABEL}
        hideLabel
        placeholder="Agregar… (ej: leche x2)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        enterKeyHint="done"
        autoComplete="off"
        className={styles.field}
      />
      <IconButton type="submit" label={LABEL} icon={<Plus />} variant="accent" disabled={!parsed} />
    </form>
  )
}

function alreadyThere({ name, quantity }: AddResult) {
  return `${name} ya estaba en la lista: ahora x${quantity}`
}
