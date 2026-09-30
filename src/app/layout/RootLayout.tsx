import { LogOut } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { Login, useSession } from '@/features/auth'
import { NewExpenseForm } from '@/features/expenses'
import { requestPersistentStorage } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAutoSync } from '@/lib/sync'
import { Alert, IconButton, Sheet } from '@/ui'
import { UpdatePrompt } from '../UpdatePrompt'
import { BottomNav } from './BottomNav'
import { Brand } from './Brand'
import styles from './RootLayout.module.css'

// Root route: gates everything behind the session and hosts the shared chrome
export function RootLayout() {
  const session = useSession()

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  return (
    <>
      {!supabase ? (
        <AuthShell>
          <Alert tone="danger">
            Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
          </Alert>
        </AuthShell>
      ) : session === undefined ? null : session ? (
        <AppShell />
      ) : (
        <AuthShell>
          <Login />
        </AuthShell>
      )}
      <UpdatePrompt />
      <ScrollRestoration />
    </>
  )
}

function AppShell() {
  const syncError = useAutoSync()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Brand />
        <IconButton
          label="Cerrar sesión"
          icon={<LogOut />}
          onClick={() => supabase!.auth.signOut()}
        />
      </header>
      <main className={styles.main}>
        {syncError && <Alert tone="danger">No se pudo sincronizar: {syncError}</Alert>}
        <Outlet />
      </main>
      <BottomNav onAdd={() => setIsAdding(true)} />
      <Sheet open={isAdding} onClose={() => setIsAdding(false)} title="Nuevo gasto">
        <NewExpenseForm onSaved={() => setIsAdding(false)} />
      </Sheet>
    </div>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Brand />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
