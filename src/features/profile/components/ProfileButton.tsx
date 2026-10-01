import { LogOut, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import { signOut, unsyncedBeforeSignOut } from '@/features/auth'
import type { Profile } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Alert, AmountField, Button, Sheet, Stack, TextField, useToast } from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { profileRepo, useProfile } from '../profileRepo'
import styles from './ProfileButton.module.css'

// The header's avatar: opens the profile (name, income) and signing out. Going to another
// screen (Android's back, say) closes it: it belongs to the screen it was opened on.
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
        <Initial name={profile?.name} />
      </button>
      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Perfil">
        {profile !== undefined && (
          <ProfileForm profile={profile} email={email} onSaved={() => setIsOpen(false)} />
        )}
      </Sheet>
    </>
  )
}

function Initial({ name }: { name?: string }) {
  const initial = name?.trim().charAt(0).toUpperCase()
  return initial ? <span aria-hidden>{initial}</span> : <UserRound aria-hidden />
}

function ProfileForm({
  profile,
  email,
  onSaved,
}: {
  profile: Profile | null
  email?: string
  onSaved: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(profile?.name ?? '')
  const [income, setIncome] = useState(
    profile?.monthlyIncome ? amountToInput(profile.monthlyIncome) : '',
  )
  // Income is optional: empty is fine, something unreadable isn't
  const parsedIncome = income === '' ? undefined : parseAmount(income)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (parsedIncome === null) return
    await profileRepo.save({ name: name.trim() || undefined, monthlyIncome: parsedIncome })
    toast('Perfil guardado')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved()
  }

  return (
    <Stack gap={5}>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          {email && <p className={styles.email}>{email}</p>}
          <TextField
            label="Nombre"
            placeholder="Cómo te llamás"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
          />
          <div>
            <span className={styles.label}>Ingreso mensual</span>
            <AmountField label="Ingreso mensual" value={income} onValueChange={setIncome} />
          </div>
          <Button type="submit" size="lg" fullWidth disabled={parsedIncome === null}>
            Guardar
          </Button>
        </Stack>
      </form>
      <SignOutButton />
    </Stack>
  )
}

// Signing out clears this device's data. If some change couldn't be uploaded, it warns
// first and only a second tap signs out anyway.
function SignOutButton() {
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
    await signOut()
  }

  return (
    <Stack gap={3}>
      {unsynced > 0 && (
        <Alert tone="danger">
          {unsynced === 1 ? 'Hay 1 cambio' : `Hay ${unsynced} cambios`} sin sincronizar. Si cerrás
          sesión ahora, se pierden.
        </Alert>
      )}
      <Button
        variant="ghost"
        size="lg"
        fullWidth
        icon={<LogOut aria-hidden />}
        loading={busy}
        onClick={handleClick}
      >
        {unsynced > 0 ? 'Cerrar sesión igual' : 'Cerrar sesión'}
      </Button>
    </Stack>
  )
}
