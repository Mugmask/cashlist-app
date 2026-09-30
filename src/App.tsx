import { useEffect } from 'react'
import { pedirAlmacenamientoPersistente } from './lib/db'
import { supabase } from './lib/supabase'
import { UpdatePrompt } from './UpdatePrompt'

export default function App() {
  useEffect(() => {
    pedirAlmacenamientoPersistente()
  }, [])

  return (
    <main className="app">
      <header>
        <h1>Cashlist</h1>
      </header>
      <p>La app está instalada y lista. Próximo paso: login y carga de gastos.</p>
      <p className="muted">Supabase: {supabase ? 'configurado' : 'sin configurar (.env.local)'}</p>
      <UpdatePrompt />
    </main>
  )
}
