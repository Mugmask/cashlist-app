import '@fontsource-variable/inter'
import '@fontsource-variable/sora'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import './app/global.css'
import { router } from './app/router'

// Dev-only design system catalog at /ui; stripped from production builds
const UiPlayground = import.meta.env.DEV ? lazy(() => import('./app/UiPlayground')) : null
const showPlayground = UiPlayground && location.pathname === '/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showPlayground ? (
      <Suspense>
        <UiPlayground />
      </Suspense>
    ) : (
      <RouterProvider router={router} />
    )}
  </StrictMode>,
)
