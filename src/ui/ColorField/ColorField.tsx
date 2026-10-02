import styles from './ColorField.module.css'

export interface ColorFieldProps {
  value: string // #rrggbb
  onChange: (value: string) => void // fires while dragging in the picker, too
  label?: string
}

// Any color: a row showing the color and its code; tapping anywhere on it opens the device's
// color picker. Goes under an OptionGrid of presets, shown once "Personalizado" is picked.
export function ColorField({ value, onChange, label = 'Tu color' }: ColorFieldProps) {
  return (
    <label className={styles.row}>
      <input
        type="color"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.hex}>{value.toUpperCase()}</span>
      </span>
    </label>
  )
}

// The "Personalizado" tile's swatch: every hue, since it can be any
export function RainbowSwatch() {
  return <span className={styles.rainbow} aria-hidden />
}
