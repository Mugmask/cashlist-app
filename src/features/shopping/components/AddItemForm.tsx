import { Plus } from 'lucide-react'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { runSync } from '@/lib/sync'
import { IconButton, TextField, useToast } from '@/ui'
import { aisleLabel, aisleOf, type AisleNames } from '../aisles'
import { parseItemInput } from '../items'
import { shoppingRepo, type AddResult } from '../shoppingRepo'
import styles from './AddItemForm.module.css'

const LABEL = 'Agregar a la lista'

// Puts a product on the list; how many is set on the list with − / + ("leche x2" typed still
// works). `inputRef` lets the page focus the field (the bottom nav's + on this screen). Adding
// one already there says so instead of silently doing it.
export function AddItemForm({
  inputRef: outerRef,
  names,
  onPickAisle,
}: {
  inputRef?: RefObject<HTMLInputElement | null>
  names: AisleNames // the user's names for the sections
  onPickAisle: (id: string) => void // "Cambiar" in the toast: picks another section for it
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
    if (result.outcome === 'more') {
      toast(alreadyThere(result))
    } else {
      // Where it went: the guess can be wrong, and this is the moment to fix it
      const aisle = aisleLabel(aisleOf({ name: result.name, aisle: result.aisle }), names)
      toast(`${result.name} → ${aisle}`, {
        action: { label: 'Cambiar', onClick: () => onPickAisle(result.id) },
      })
    }
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
        placeholder="Agregar a la lista…"
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
