import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useProfile, profileRepo } from '@/features/profile'
import { runSync } from '@/lib/sync'
import { Button, IconButton, Sheet, Stack, TextField, useToast } from '@/ui'
import { capitalize } from '@/utils/text'
import { AISLES, type AisleNames } from '../aisles'
import styles from './AisleNamesSheet.module.css'

const MAX_NAME = 30

export interface AisleNamesSheetProps {
  open: boolean
  onClose: () => void
}

// Renaming the store sections ("Lácteos y fiambres" → "Heladera"). Empty goes back to the app's.
export function AisleNamesSheet({ open, onClose }: AisleNamesSheetProps) {
  const profile = useProfile()
  return (
    <Sheet open={open} onClose={onClose} title="Nombres de las secciones">
      {/* Mounted per opening, so it starts from what's saved */}
      {open && profile !== undefined && (
        <AisleNamesForm saved={profile?.aisleNames ?? {}} onDone={onClose} />
      )}
    </Sheet>
  )
}

function AisleNamesForm({ saved, onDone }: { saved: AisleNames; onDone: () => void }) {
  const toast = useToast()
  const [names, setNames] = useState<Record<string, string>>({ ...saved })
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    if (busy) return
    setBusy(true)
    // Only the ones really renamed: one left empty or as the app's goes back to the app's
    const changed = Object.fromEntries(
      AISLES.flatMap((a) => {
        const name = capitalize((names[a.id] ?? '').trim())
        return name && name !== a.label ? [[a.id, name]] : []
      }),
    )
    await profileRepo.saveAisleNames(changed)
    toast('Secciones guardadas')
    runSync().catch(() => {})
    onDone()
  }

  return (
    <Stack gap={4}>
      <p className={styles.hint}>Poneles el nombre que uses vos. Vacío vuelve al original.</p>
      <ul className={styles.list}>
        {AISLES.map((a) => {
          const value = names[a.id] ?? ''
          return (
            <li key={a.id} className={styles.row}>
              <TextField
                label={a.label}
                hideLabel
                placeholder={a.label}
                value={value}
                maxLength={MAX_NAME}
                autoCapitalize="sentences"
                autoComplete="off"
                onChange={(e) => setNames((current) => ({ ...current, [a.id]: e.target.value }))}
                className={styles.field}
              />
              {value.trim() !== '' && (
                <IconButton
                  label={`Volver a ${a.label}`}
                  icon={<RotateCcw />}
                  onClick={() => setNames((current) => ({ ...current, [a.id]: '' }))}
                />
              )}
            </li>
          )
        })}
      </ul>
      <Button size="lg" fullWidth loading={busy} onClick={handleSave}>
        Guardar
      </Button>
    </Stack>
  )
}
