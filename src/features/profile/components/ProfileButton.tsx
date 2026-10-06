import { LogOut, UserRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { signOut, unsyncedBeforeSignOut } from '@/features/auth'
import type { Profile } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { runSync } from '@/lib/sync'
import { Alert, Button, cx, Sheet, Spinner, Stack, TextField, useToast } from '@/ui'
import { amountInputChange, amountToInput, parseAmount } from '@/utils/currency'
import { profileRepo, useProfile } from '../profileRepo'
import { AccentPicker } from './AccentPicker'
import { ChangePassword } from './ChangePassword'
import styles from './ProfileButton.module.css'

// The header's avatar: opens the profile and signing out. Going to another screen
// (Android's back, say) closes it: it belongs to the screen it was opened on.
export function ProfileButton({ email }: { email?: string }) {
  const profile = useProfile()
  const { pathname } = useLocation()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const isOpen = openOn === pathname
  // Left for another screen: forgotten, so coming back doesn't open it again
  if (openOn !== null && !isOpen) setOpenOn(null)
  const setIsOpen = (open: boolean) => setOpenOn(open ? pathname : null)

  return (
    <>
      <button
        type="button"
        className={styles.avatar}
        aria-label="Perfil"
        title="Perfil"
        onClick={() => setIsOpen(true)}
      >
        <UserRound aria-hidden />
      </button>
      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Perfil">
        {profile !== undefined && <ProfileContent profile={profile} email={email} />}
      </Sheet>
    </>
  )
}

// Who's signed in, then one section per kind of thing: what the app knows about you, how it
// looks (applied on tap), and the account. Only "Tus datos" needs saving, so only it has a
// save button, and only once something there changed.
function ProfileContent({ profile, email }: { profile: Profile | null; email?: string }) {
  return (
    <Stack gap={7}>
      <div className={styles.identity}>
        <span className={styles.identityAvatar}>
          <UserRound aria-hidden />
        </span>
        <div className={styles.identityText}>
          <span className={styles.identityName}>{profile?.name || 'Sin nombre'}</span>
          {email && <span className={styles.identityEmail}>{email}</span>}
        </div>
      </div>
      <Section title="Tus datos">
        <DataForm profile={profile} />
      </Section>
      <Section title="Apariencia">
        <AccentPicker />
      </Section>
      {/* Local mode has no account */}
      {supabase && (
        <Section title="Cuenta">
          <div className={styles.list}>
            <ChangePassword />
            <SignOutRow />
          </div>
        </Section>
      )}
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  )
}

function DataForm({ profile }: { profile: Profile | null }) {
  const toast = useToast()
  const [name, setName] = useState(profile?.name ?? '')
  const [income, setIncome] = useState(
    profile?.monthlyIncome ? amountToInput(profile.monthlyIncome) : '',
  )
  // Income is optional: empty is fine, something unreadable isn't
  const parsedIncome = income === '' ? undefined : parseAmount(income)
  // As typed: lowercase stays lowercase if that's how they want it
  const cleanName = name.trim() || undefined
  // Against what's saved: right after saving, the profile catches up and this goes false
  const changed =
    cleanName !== (profile?.name || undefined) || parsedIncome !== profile?.monthlyIncome

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (parsedIncome === null || !changed) return
    await profileRepo.save({ name: cleanName, monthlyIncome: parsedIncome })
    toast('Datos guardados')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <TextField
          label="Nombre"
          autoCapitalize="none" // no capital forced by the keyboard either
          placeholder="Cómo te llamás"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
        />
        <TextField
          label="Ingreso mensual"
          inputMode="decimal"
          placeholder="0"
          icon={<span className={styles.currency}>$</span>}
          value={income}
          onChange={(e) => setIncome(amountInputChange(income, e.target.value))}
          hint="Tu sueldo fijo: se suma solo a cada mes"
          error={parsedIncome === null ? 'Revisá el monto' : null}
          autoComplete="off"
        />
        <Button type="submit" size="lg" fullWidth disabled={!changed || parsedIncome === null}>
          Guardar cambios
        </Button>
      </Stack>
    </form>
  )
}

// Signing out clears this device's data. If some change couldn't be uploaded, it warns
// first and only a second tap signs out anyway.
function SignOutRow() {
  const toast = useToast()
  const [unsynced, setUnsynced] = useState(0)
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    const pending = unsynced > 0 ? 0 : await unsyncedBeforeSignOut()
    if (pending > 0) {
      setUnsynced(pending)
      setBusy(false)
      return
    }
    if (await signOut()) return
    setBusy(false)
    toast('No se pudo cerrar sesión: probá con conexión')
  }

  return (
    <>
      {unsynced > 0 && (
        <div className={styles.rowBody}>
          <Alert tone="danger">
            {unsynced === 1 ? 'Hay 1 cambio' : `Hay ${unsynced} cambios`} sin sincronizar. Si cerrás
            sesión ahora, se pierden.
          </Alert>
        </div>
      )}
      <button
        type="button"
        className={cx(styles.row, styles.rowDanger)}
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={handleClick}
      >
        {busy ? <Spinner size={18} /> : <LogOut aria-hidden />}
        <span>{unsynced > 0 ? 'Cerrar sesión igual' : 'Cerrar sesión'}</span>
      </button>
    </>
  )
}
