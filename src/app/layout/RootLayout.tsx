import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, ScrollRestoration, useSearchParams } from 'react-router'
import { Login, useSession } from '@/features/auth'
import { AddExpenseProvider } from '@/features/expenses'
import { requestPersistentStorage } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAutoSync } from '@/lib/sync'
import { Alert, IconButton, ToastProvider } from '@/ui'
import { UpdatePrompt } from '../UpdatePrompt'
import { BottomNav } from './BottomNav'
import { Brand } from './Brand'
import { OfflineBadge } from './OfflineBadge'
import styles from './RootLayout.module.css'
import { SplashScreen } from './SplashScreen'
import { setDocumentTitle, useFocusHeadingOnNavigate, usePageTitle } from './usePageNavigation'

// Home screen shortcut (manifest) that opens the app straight into adding an expense
const ADD_EXPENSE_ACTION = 'add-expense'

// Root route: gates everything behind the session and hosts the shared chrome
export function RootLayout() {
  const session = useSession()

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  return (
    <ToastProvider>
      {!supabase ? (
        <AuthShell>
          <Alert tone="danger">
            Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
          </Alert>
        </AuthShell>
      ) : session === undefined ? (
        <SplashScreen />
      ) : session ? (
        <AppShell />
      ) : (
        <AuthShell>
          <Login />
        </AuthShell>
      )}
      <UpdatePrompt />
      <ScrollRestoration />
    </ToastProvider>
  )
}

function AppShell() {
  const syncError = useAutoSync()
  const mainRef = useRef<HTMLElement>(null)
  usePageTitle()
  useFocusHeadingOnNavigate(mainRef)
  const [params, setParams] = useSearchParams()
  // Read once on mount: the effect below then drops the param
  const [openedFromShortcut] = useState(() => params.get('action') === ADD_EXPENSE_ACTION)

  // Drop the shortcut's ?action once used, so a reload or going back doesn't reopen the sheet
  useEffect(() => {
    if (params.get('action') !== ADD_EXPENSE_ACTION) return
    const next = new URLSearchParams(params)
    next.delete('action')
    setParams(next, { replace: true })
  }, [params, setParams])

  return (
    <AddExpenseProvider initiallyOpen={openedFromShortcut}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Brand />
          <OfflineBadge />
          <IconButton
            label="Cerrar sesión"
            icon={<LogOut />}
            onClick={() => supabase!.auth.signOut()}
          />
        </header>
        <main ref={mainRef} className={styles.main}>
          {syncError && <Alert tone="danger">{syncError}</Alert>}
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </AddExpenseProvider>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    setDocumentTitle('Entrar')
  }, [])

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Brand />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
