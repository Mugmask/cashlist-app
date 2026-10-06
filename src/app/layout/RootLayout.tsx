import { useEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useSearchParams } from 'react-router'
import { Login, useSession } from '@/features/auth'
import { AddExpenseProvider, useCategories } from '@/features/expenses'
import { MonthProvider, MonthSwitcher } from '@/features/month'
import { ProfileButton } from '@/features/profile'
import { requestPersistentStorage } from '@/lib/db'
import { LOCAL_USER_ID, supabase } from '@/lib/supabase'
import { useAutoSync, useFirstSync } from '@/lib/sync'
import { Alert, cx, PageLoader, PrimaryActionProvider, ToastProvider } from '@/ui'
import { UpdatePrompt } from '../UpdatePrompt'
import { AuthShell } from './AuthShell'
import { BackLink } from './BackLink'
import { BottomNav, NAV_PATHS } from './BottomNav'
import { OfflineBadge } from './OfflineBadge'
import { PageSkeleton } from './PageSkeleton'
import { PullToRefresh } from './PullToRefresh'
import styles from './RootLayout.module.css'
import { SplashScreen } from './SplashScreen'
import { useBackTarget } from './useBackTarget'
import { useFocusHeadingOnNavigate, usePageTitle } from './usePageNavigation'

// Screens that show one month, and so the month switcher in the header
const MONTHLY_SCREENS = new Set(['/', '/expenses', '/fixed', '/incomes', '/analysis'])

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
        <AppShell userId={LOCAL_USER_ID} />
      ) : session === undefined ? (
        <SplashScreen />
      ) : session ? (
        <AppShell userId={session.user.id} email={session.user.email} />
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

function AppShell({ userId, email }: { userId: string; email?: string }) {
  const syncError = useAutoSync()
  // The screens look categories up by id: the user's ones must be read before they show
  const categories = useCategories()
  // Signed in on a device without the data yet: a skeleton until the first sync brings it,
  // so screens don't fill in table by table
  const synced = useFirstSync(userId)
  const mainRef = useRef<HTMLElement>(null)
  usePageTitle()
  useFocusHeadingOnNavigate(mainRef)
  const back = useBackTarget()
  const { pathname } = useLocation()
  const monthly = MONTHLY_SCREENS.has(pathname)
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
            <PullToRefresh />
            {/* The shopping list isn't about a month: with only the profile left, the header
                doesn't take a row of its own (the screen's title sits beside the profile) */}
            <header className={cx(styles.header, !monthly && styles.headerBare)}>
              {monthly && <MonthSwitcher />}
              <div className={styles.headerEnd}>
                <OfflineBadge />
                <ProfileButton email={email} />
              </div>
            </header>
            <main ref={mainRef} className={styles.main}>
              {!supabase && (
                <Alert>
                  Modo local: sin cuenta ni sync, los datos quedan solo en este navegador.
                </Alert>
              )}
              {syncError && <Alert tone="danger">{syncError}</Alert>}
              {/* Screens off the bottom nav go back to the one they were opened from */}
              {back && !NAV_PATHS.has(pathname) && <BackLink target={back} />}
              {/* Each screen's sections rise in one after the other (RootLayout.module.css) */}
              <div className={styles.page}>
                {synced === false ? (
                  <PageSkeleton />
                ) : categories.loaded && synced ? (
                  <Outlet />
                ) : (
                  <PageLoader />
                )}
              </div>
            </main>
            <BottomNav />
          </div>
        </MonthProvider>
      </PrimaryActionProvider>
    </AddExpenseProvider>
  )
}
