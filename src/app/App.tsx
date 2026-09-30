import { useEffect } from 'react'
import { Login, useSession } from '@/features/auth'
import { ExpenseList, NewExpenseForm } from '@/features/expenses'
import { requestPersistentStorage } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAutoSync } from '@/lib/sync'
import { UpdatePrompt } from './UpdatePrompt'

export default function App() {
  const session = useSession()

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  return (
    <main className="app">
      <header className="header">
        <h1>Cashlist</h1>
        {session && (
          <button className="secondary" onClick={() => supabase!.auth.signOut()}>
            Salir
          </button>
        )}
      </header>

      {!supabase ? (
        <p className="error">
          Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
        </p>
      ) : session === undefined ? null : session ? (
        <Expenses />
      ) : (
        <Login />
      )}

      <UpdatePrompt />
    </main>
  )
}

function Expenses() {
  const syncError = useAutoSync()

  return (
    <div className="stack">
      <NewExpenseForm />
      {syncError && <p className="error">No se pudo sincronizar: {syncError}</p>}
      <ExpenseList />
    </div>
  )
}
