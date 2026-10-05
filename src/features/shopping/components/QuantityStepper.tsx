import { Minus, Plus, Trash2 } from 'lucide-react'
import { IconButton } from '@/ui'
import { MAX_QUANTITY } from '../items'
import styles from './QuantityStepper.module.css'

export interface QuantityStepperProps {
  name: string // the product, for the buttons' accessible names
  value: number
  onChange: (quantity: number) => void
  onRemove: () => void
  removeLabel?: string // "Sacar Leche de la lista" by default
}

// − quantity +, beside a product. At 1 the − becomes a bin: one tap less takes it off.
export function QuantityStepper({
  name,
  value,
  onChange,
  onRemove,
  removeLabel = `Sacar ${name} de la lista`,
}: QuantityStepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={`Cantidad de ${name}`}>
      {value > 1 ? (
        <IconButton
          label={`Uno menos de ${name}`}
          icon={<Minus />}
          className={styles.button}
          onClick={() => onChange(value - 1)}
        />
      ) : (
        <IconButton
          label={removeLabel}
          icon={<Trash2 />}
          className={styles.button}
          onClick={onRemove}
        />
      )}
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <IconButton
        label={`Uno más de ${name}`}
        icon={<Plus />}
        className={styles.button}
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      />
    </div>
  )
}
