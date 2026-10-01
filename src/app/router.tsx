import { createBrowserRouter, type RouteObject } from 'react-router'
import { AnalysisPage } from '@/features/analysis'
import { ExpensesPage } from '@/features/expenses'
import { FixedPage } from '@/features/fixed'
import { HomePage } from '@/features/home'
import { ShoppingPage } from '@/features/shopping'
import { Crash } from './errors/Crash'
import { NotFoundPage } from './errors/NotFoundPage'
import { RouteError } from './errors/RouteError'
import { RootLayout } from './layout/RootLayout'

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
    children: [
      {
        // A page failed: show the error inside the shell, bottom nav still works
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage />, handle: titled('Inicio') },
          { path: 'expenses', element: <ExpensesPage />, handle: titled('Gastos') },
          { path: 'fixed', element: <FixedPage />, handle: titled('Gastos fijos') },
          { path: 'shopping', element: <ShoppingPage />, handle: titled('Compras') },
          {
            path: 'analysis',
            element: <AnalysisPage />,
            handle: titled('En qué se va la plata'),
          },
          ...devRoutes,
          { path: '*', element: <NotFoundPage />, handle: titled('Página no encontrada') },
        ],
      },
    ],
  },
])
