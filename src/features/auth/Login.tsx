import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { loginErrorMessage } from '@/utils/errors'
import { Alert, Button, Card, Stack, TextField } from '@/ui'
import styles from './Login.module.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <Card as="form" padding="lg" onSubmit={handleSubmit}>
      <Stack gap={4}>
        <div>
          <h1 className={styles.title}>Hola de nuevo</h1>
          <p className={styles.subtitle}>Entrá para ver tus gastos.</p>
        </div>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Entrar
        </Button>
      </Stack>
    </Card>
  )
}
