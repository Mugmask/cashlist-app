import { useEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useSearchParams } from 'react-router'
import { Login, useSession } from '@/features/auth'
import { AddExpenseProvider } from '@/features/expenses'
import { MonthProvider, MonthSwitcher } from '@/features/month'
import { ProfileButton } from '@/features/profile'
import { requestPersistentStorage } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAutoSync } from '@/lib/sync'
import { Alert, PrimaryActionProvider, ToastProvider } from '@/ui'
import { UpdatePrompt } from '../UpdatePrompt'
import { AuthShell } from './AuthShell'
import { BottomNav } from './BottomNav'
import { OfflineBadge } from './OfflineBadge'
import styles from './RootLayout.module.css'
import { SplashScreen } from './SplashScreen'
import { useFocusHeadingOnNavigate, usePageTitle } from './usePageNavigation'

// Screens that show one month, and so the month switcher in the header
const MONTHLY_SCREENS = new Set(['/', '/expenses', '/fixed', '/analysis'])

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
        <AppShell email={session.user.email} />
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

function AppShell({ email }: { email?: string }) {
  const syncError = useAutoSync()
  const mainRef = useRef<HTMLElement>(null)
  usePageTitle()
  useFocusHeadingOnNavigate(mainRef)
  const { pathname } = useLocation()
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
      <PrimaryActionProvider>
        <MonthProvider>
          <div className={styles.shell}>
            <header className={styles.header}>
              <OfflineBadge />
              {/* The month, centered on the screen; the shopping list isn't about a month */}
              {MONTHLY_SCREENS.has(pathname) ? <MonthSwitcher /> : <span />}
              <div className={styles.headerEnd}>
                <ProfileButton email={email} />
              </div>
            </header>
            <main ref={mainRef} className={styles.main}>
              {syncError && <Alert tone="danger">{syncError}</Alert>}
              <Outlet />
            </main>
            <BottomNav />
          </div>
        </MonthProvider>
      </PrimaryActionProvider>
    </AddExpenseProvider>
  )
}
