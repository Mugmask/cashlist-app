import { useEffect } from 'react'
import { ListaGastos } from './components/ListaGastos'
import { Login } from './components/Login'
import { NuevoGasto } from './components/NuevoGasto'
import { pedirAlmacenamientoPersistente } from './lib/db'
import { supabase } from './lib/supabase'
import { useAutoSync } from './lib/useAutoSync'
import { useSesion } from './lib/useSesion'
import { UpdatePrompt } from './UpdatePrompt'

export default function App() {
  const sesion = useSesion()

  useEffect(() => {
    pedirAlmacenamientoPersistente()
  }, [])

  return (
    <main className="app">
      <header className="header">
        <h1>Cashlist</h1>
        {sesion && (
          <button className="secondary" onClick={() => supabase!.auth.signOut()}>
            Salir
          </button>
        )}
      </header>

      {!supabase ? (
        <p className="error">Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</p>
      ) : sesion === undefined ? null : sesion ? (
        <Gastos />
      ) : (
        <Login />
      )}

      <UpdatePrompt />
    </main>
  )
}

function Gastos() {
  const errorSync = useAutoSync()

  return (
    <div className="stack">
      <NuevoGasto />
      {errorSync && <p className="error">No se pudo sincronizar: {errorSync}</p>}
      <ListaGastos />
    </div>
  )
}
