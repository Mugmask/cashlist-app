import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setCargando(false)
  }

  return (
    <form className="card stack" onSubmit={entrar}>
      <h2>Entrar</h2>
      <input
        type="email"
        placeholder="Email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
    </form>
  )
}
