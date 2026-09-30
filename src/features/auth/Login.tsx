import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Alert, Button, Card, IconButton, Stack, TextField } from '@/ui'
import { loginErrorMessage } from '@/utils/errors'
import styles from './Login.module.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      console.error('Login failed', err) // the raw error, for debugging
      setError(loginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card as="form" padding="lg" onSubmit={handleSubmit} className={styles.card}>
      <Stack gap={5}>
        <div>
          <h1 className={styles.title}>Hola de nuevo</h1>
          <p className={styles.subtitle}>Entrá para ver tus gastos.</p>
        </div>
        <Stack gap={4}>
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="vos@mail.com"
            icon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            icon={<LockKeyhole />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <IconButton
                label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                icon={showPassword ? <EyeOff /> : <Eye />}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              />
            }
          />
        </Stack>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Entrar
          {!loading && <ArrowRight aria-hidden className={styles.arrow} />}
        </Button>
      </Stack>
    </Card>
  )
}
