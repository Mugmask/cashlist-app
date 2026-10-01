import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Alert, Button, IconButton, Stack, TextField, useToast } from '@/ui'
import { passwordErrorMessage } from '@/utils/errors'

export const MIN_PASSWORD_LENGTH = 8

// Changing the password of the user signed in: closed behind a button, since it's rare.
// Needs a connection; Supabase may refuse a weak one, or the same one again.
export function ChangePassword() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const mismatch = repeat.length > 0 && repeat !== password
  const isValid = password.length >= MIN_PASSWORD_LENGTH && repeat === password

  function close() {
    setOpen(false)
    setPassword('')
    setRepeat('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || busy || !supabase) return
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      console.error('Password change failed', updateError)
      setError(passwordErrorMessage(updateError))
      return
    }
    toast('Contraseña cambiada')
    close()
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="lg"
        fullWidth
        icon={<KeyRound aria-hidden />}
        onClick={() => setOpen(true)}
      >
        Cambiar contraseña
      </Button>
    )
  }

  const toggle = (
    <IconButton
      label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      icon={visible ? <EyeOff /> : <Eye />}
      onClick={() => setVisible((v) => !v)}
    />
  )

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={3}>
        <TextField
          label="Contraseña nueva"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres`}
          error={tooShort ? `Tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres` : null}
          trailing={toggle}
          autoFocus
        />
        <TextField
          label="Repetila"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={mismatch ? 'No coinciden' : null}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth disabled={!isValid} loading={busy}>
          Guardar contraseña
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={close}>
          Cancelar
        </Button>
      </Stack>
    </form>
  )
}
