import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Card } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Button, IconButton, Stack, TextField, useToast } from '@/ui'
import { normalizeName } from '@/utils/text'
import { cardsRepo, MAX_CARD_NAME } from '../cardsRepo'
import { useCards } from '../useCards'
import styles from './CardsSettings.module.css'

const sync = () => runSync().catch(() => {}) // on failure it stays pending and retries on its own

// The profile's cards: one with a name per card the user pays with, so each purchase says which
// and each statement keeps its own dates. With none, card purchases are on a single "Tarjeta".
export function CardsSettings() {
  const cards = useCards()
  if (!cards) return null

  return (
    <Stack gap={3}>
      {cards.live.length > 0 && (
        <ul className={styles.list}>
          {cards.live.map((card) => (
            <CardRow key={card.id} card={card} others={cards.live} />
          ))}
        </ul>
      )}
      <AddCard taken={cards.live} first={cards.live.length === 0} />
    </Stack>
  )
}

const isTaken = (name: string, cards: readonly Card[], exceptId?: string) =>
  cards.some((c) => c.id !== exceptId && normalizeName(c.name) === normalizeName(name))

// The name is edited in place and saved when the field is left
function CardRow({ card, others }: { card: Card; others: readonly Card[] }) {
  const toast = useToast()
  const [name, setName] = useState(card.name)
  const clean = name.trim()

  async function save() {
    if (clean === card.name) return
    if (clean === '' || isTaken(clean, others, card.id)) {
      setName(card.name)
      return
    }
    await cardsRepo.rename(card.id, clean)
    sync()
  }

  async function remove() {
    await cardsRepo.remove(card.id)
    toast(`Borraste ${card.name}`)
    sync()
  }

  return (
    <li className={styles.row}>
      <TextField
        label={`Nombre de ${card.name}`}
        hideLabel
        value={name}
        maxLength={MAX_CARD_NAME}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        className={styles.name}
      />
      <IconButton label={`Borrar ${card.name}`} icon={<Trash2 />} onClick={remove} />
    </li>
  )
}

function AddCard({ taken, first }: { taken: readonly Card[]; first: boolean }) {
  const [name, setName] = useState('')
  const clean = name.trim()
  const repeated = clean !== '' && isTaken(clean, taken)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (clean === '' || repeated) return
    await cardsRepo.create(clean)
    setName('')
    sync()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={3}>
        <TextField
          label="Nueva tarjeta"
          placeholder="Visa Santander, Mercado Pago…"
          value={name}
          maxLength={MAX_CARD_NAME}
          onChange={(e) => setName(e.target.value)}
          error={repeated ? 'Ya tenés una con ese nombre' : null}
          hint={first ? 'Tus compras con tarjeta de antes quedan en esta' : undefined}
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" fullWidth disabled={clean === '' || repeated}>
          Agregar tarjeta
        </Button>
      </Stack>
    </form>
  )
}
