import { ChipGroup, TextField } from '@/ui'
import { amountInputChange, formatCurrencyShort, type Currency } from '@/utils/currency'
import { isValidPart, partOf, SHARE_CHIPS, type ShareOption } from '../shared'
import styles from './ShareField.module.css'

export interface ShareFieldProps {
  label: string // "¿Lo compartiste?" for something already paid, "¿Lo compartís?" for a fixed one
  share: ShareOption
  onShareChange: (share: ShareOption) => void
  part: string // my exact part as typed, for 'part'
  onPartChange: (part: string) => void
  total: number | null // the whole bill, in `currency`; null while it isn't a valid amount
  currency: Currency
}

// Whether a bill paid in full is shared, and my part of it: an even split or an exact amount.
// Under the chips, what my part comes to (or why it can't be).
export function ShareField({
  label,
  share,
  onShareChange,
  part,
  onPartChange,
  total,
  currency,
}: ShareFieldProps) {
  const mine = total === null ? null : partOf(total, share, part)
  const shown = share !== '1' && total !== null && mine !== null
  const valid = shown && isValidPart(total, mine)

  return (
    <div>
      <ChipGroup
        label={label}
        showLabel
        options={SHARE_CHIPS}
        value={share}
        onChange={onShareChange}
      />
      {share === 'part' && (
        <TextField
          className={styles.part}
          label={currency === 'USD' ? 'Tu parte, en dólares' : 'Tu parte'}
          hideLabel
          placeholder={currency === 'USD' ? 'Tu parte en US$' : 'Tu parte en $'}
          inputMode="decimal"
          autoComplete="off"
          value={part}
          onChange={(e) => onPartChange(amountInputChange(part, e.target.value))}
        />
      )}
      {shown && (
        <p className={valid ? styles.note : styles.error} role="status">
          {valid
            ? `Tu parte: ${formatCurrencyShort(mine, currency)} de ${formatCurrencyShort(total, currency)}`
            : 'Tu parte tiene que ser menos que el total'}
        </p>
      )}
    </div>
  )
}
