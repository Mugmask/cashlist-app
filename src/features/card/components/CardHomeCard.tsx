import { ChevronRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { runSync } from '@/lib/sync'
import { Amount, Button, Card, Sheet, Stack, TextField, useToast } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { formatDayMonth } from '@/utils/dates'
import { cardsRepo } from '../cardsRepo'
import type { CardStatus } from '../summary'
import styles from './CardHomeCard.module.css'

// One small tile per card on home: the statement it's filling now, when it closes and when
// it's due (the month whose money pays it), and the installments already on the ones after.
// Tapping it corrects those dates: banks move them every month.
export function CardHomeCard({ summary }: { summary: readonly CardStatus[] }) {
  const [editing, setEditing] = useState<CardStatus | null>(null)

  return (
    <>
      {summary.map((status) => (
        <CardTile key={status.cardId} status={status} onOpen={() => setEditing(status)} />
      ))}
      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.name ?? 'Tarjeta'}
      >
        {editing && <CardDates status={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  )
}

function CardTile({ status, onOpen }: { status: CardStatus; onOpen: () => void }) {
  const { name, open, later } = status
  const titleId = `card-tile-${status.cardId || 'default'}`
  // "~" on dates no statement said yet
  const approx = open.cycle.estimated ? '~' : ''

  return (
    <button type="button" className={styles.link} onClick={onOpen}>
      <Card as="section" className={styles.tile} aria-labelledby={titleId}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {name}
          </h2>
          <ChevronRight aria-hidden className={styles.chevron} />
        </header>
        <Amount value={open.total} size="lg" />
        <span className={styles.muted}>
          Cierra {approx}
          {formatDayMonth(open.cycle.closesOn)} · vence {approx}
          {formatDayMonth(open.cycle.dueOn)}
        </span>
        {later > 0 && (
          <span className={styles.muted}>Siguen {formatCurrencyShort(later)} en cuotas</span>
        )}
      </Card>
    </button>
  )
}

// The statement in progress's real dates, from the bank's app or the last statement ("Próximo
// cierre"), over the estimated ones
function CardDates({ status, onDone }: { status: CardStatus; onDone: () => void }) {
  const toast = useToast()
  const { cycle } = status.open
  const [closesOn, setClosesOn] = useState(cycle.closesOn)
  const [dueOn, setDueOn] = useState(cycle.dueOn)
  const valid = closesOn !== '' && dueOn !== '' && dueOn >= closesOn

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    // Purchases from before the user had cards: saving their dates makes the card for them
    const cardId = status.card?.id ?? (await cardsRepo.create(status.name))
    await cardsRepo.setDates(cardId, cycle, closesOn, dueOn)
    toast('Fechas guardadas')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={5}>
        <p className={styles.sheetText}>
          Resumen en curso: <strong>{formatCurrencyShort(status.open.total)}</strong>
          {status.open.count > 0 &&
            ` en ${status.open.count === 1 ? '1 compra' : `${status.open.count} compras`}`}
          . Se paga con la plata del mes en que vence.
        </p>
        <TextField
          label="Cierre"
          type="date"
          value={closesOn}
          onChange={(e) => setClosesOn(e.target.value)}
          hint={cycle.estimated ? 'Estimado: corregilo con el del banco' : undefined}
        />
        <TextField
          label="Vencimiento"
          type="date"
          value={dueOn}
          min={closesOn}
          onChange={(e) => setDueOn(e.target.value)}
          error={valid || dueOn === '' ? null : 'Vence después del cierre'}
        />
        <Button type="submit" size="lg" fullWidth disabled={!valid}>
          Guardar fechas
        </Button>
        <Link to="/expenses?pago=tarjeta" className={styles.sheetLink} onClick={onDone}>
          Ver las compras con tarjeta
          <ChevronRight aria-hidden />
        </Link>
      </Stack>
    </form>
  )
}
