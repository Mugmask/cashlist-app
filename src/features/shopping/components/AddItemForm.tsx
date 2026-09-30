import { Plus } from 'lucide-react'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { runSync } from '@/lib/sync'
import { IconButton, TextField } from '@/ui'
import { parseItemInput } from '../items'
import { shoppingRepo } from '../shoppingRepo'
import styles from './AddItemForm.module.css'

const COPY = {
  list: { label: 'Agregar a la lista', placeholder: 'Agregar… (ej: leche x2)' },
  pantry: { label: 'Agregar a la despensa', placeholder: 'Algo que tenés en casa…' },
}

// 'list' puts the product on the shopping list; 'pantry' registers it as already at home.
// `inputRef` lets the page focus the field (the bottom nav's + on this screen).
export function AddItemForm({
  target,
  inputRef: outerRef,
}: {
  target: 'list' | 'pantry'
  inputRef?: RefObject<HTMLInputElement | null>
}) {
  const [text, setText] = useState('')
  const ownRef = useRef<HTMLInputElement>(null)
  const inputRef = outerRef ?? ownRef
  const parsed = parseItemInput(text)
  const copy = COPY[target]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parsed) return
    if (target === 'list') await shoppingRepo.add(parsed)
    else await shoppingRepo.addToPantry(parsed.name)
    setText('')
    inputRef.current?.focus() // keep typing the next one
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        ref={inputRef}
        label={copy.label}
        hideLabel
        placeholder={copy.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        enterKeyHint="done"
        autoComplete="off"
        className={styles.field}
      />
      <IconButton
        type="submit"
        label={copy.label}
        icon={<Plus />}
        variant="accent"
        disabled={!parsed}
      />
    </form>
  )
}
