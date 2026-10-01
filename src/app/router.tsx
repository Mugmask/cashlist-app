import { createBrowserRouter, type RouteObject } from 'react-router'
import { loadAnalysisPage } from '@/features/analysis'
import { loadExpensesPage } from '@/features/expenses'
import { loadFixedPage } from '@/features/fixed'
import { HomePage } from '@/features/home'
import { loadIncomesPage } from '@/features/incomes'
import { loadShoppingPage } from '@/features/shopping'
import { Crash } from './errors/Crash'
import { NotFoundPage } from './errors/NotFoundPage'
import { RouteError } from './errors/RouteError'
import { RootLayout } from './layout/RootLayout'
import { SplashScreen } from './layout/SplashScreen'

// Dev-only route that throws, to check the error screen: /__crash
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: '__crash', element: <Crash /> }]
  : []

// Each route names itself for the browser tab and screen readers (see usePageTitle)
export interface RouteHandle {
  title: string
}

const titled = (title: string): RouteHandle => ({ title })

// Created once, outside React, as React Router's data mode requires
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // The layout itself failed: no shell to render into, so take the whole screen
    errorElement: <RouteError fullScreen />,
    // Opened straight on a screen that loads on demand (the shortcut to Compras, say): the
    // same splash as any start, while that screen's code arrives
    hydrateFallbackElement: <SplashScreen />,
    children: [
      {
        // A page failed: show the error inside the shell, bottom nav still works
        errorElement: <RouteError />,
        children: [
          // Home comes with the app, it's where it opens. The other screens load the first
          // time they're opened (from the service worker's cache once installed: instant),
          // so starting up runs less code.
          { index: true, element: <HomePage />, handle: titled('Inicio') },
          { path: 'expenses', lazy: loadExpensesPage, handle: titled('Gastos') },
          { path: 'fixed', lazy: loadFixedPage, handle: titled('Gastos fijos') },
          { path: 'incomes', lazy: loadIncomesPage, handle: titled('Ingresos') },
          { path: 'shopping', lazy: loadShoppingPage, handle: titled('Compras') },
          {
            path: 'analysis',
            lazy: loadAnalysisPage,
            handle: titled('En qué se va la plata'),
          },
          ...devRoutes,
          { path: '*', element: <NotFoundPage />, handle: titled('Página no encontrada') },
        ],
      },
    ],
  },
])
