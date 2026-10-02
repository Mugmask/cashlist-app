import { useState } from 'react'
import { Alert, OptionGrid, Stack } from '@/ui'
import {
  ACCENTS,
  applyAccent,
  customAccent,
  readAccent,
  readCustomAccent,
  readsOnBackground,
  type Accent,
} from '../accent'
import { useCurrentTheme } from '../theme'
import styles from './ProfileButton.module.css'

const FIRST_CUSTOM = '#2cff8f' // where the custom picker starts the first time: the default

// The app's color: applied on tap, no saving needed, so the whole screen is the preview.
// Besides the presets, any color: picking "Personalizado" shows the device's color picker.
export function AccentPicker() {
  const theme = useCurrentTheme()
  const [accent, setAccent] = useState(readAccent)
  const [custom, setCustom] = useState(() => readCustomAccent()?.color ?? FIRST_CUSTOM)

  function handleChange(next: Accent) {
    setAccent(next)
    if (next === 'custom') applyAccent('custom', customAccent(custom))
    else applyAccent(next)
  }

  // Fires while dragging in the picker: the app follows along
  function handleCustom(color: string) {
    setCustom(color)
    setAccent('custom')
    applyAccent('custom', customAccent(color))
  }

  return (
    <Stack gap={3}>
      <OptionGrid
        label="Color de la app"
        className={styles.accents}
        options={[
          ...ACCENTS.map(({ value, label }) => ({
            value,
            label,
            // Each swatch carries its own theme, so it shows that accent whatever is on
            content: <span className={styles.swatch} data-accent={value} aria-hidden />,
          })),
          {
            value: 'custom' as const,
            label: 'Personalizado',
            content: <span className={styles.rainbow} aria-hidden />,
          },
        ]}
        value={accent}
        onChange={handleChange}
      />
      {accent === 'custom' && (
        <>
          <label className={styles.customRow}>
            <input
              type="color"
              className={styles.colorInput}
              value={custom}
              onChange={(e) => handleCustom(e.target.value)}
            />
            <span>
              <span className={styles.customLabel}>Tu color</span>
              <span className={styles.customHex}>{custom.toUpperCase()}</span>
            </span>
          </label>
          {!readsOnBackground(custom, theme) && (
            <Alert>
              {theme === 'dark'
                ? 'Ese color se lee poco sobre el fondo oscuro: probá uno más claro.'
                : 'Ese color se lee poco sobre el fondo claro: probá uno más oscuro.'}
            </Alert>
          )}
        </>
      )}
    </Stack>
  )
}
