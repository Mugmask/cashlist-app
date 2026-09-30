import { House, RotateCw } from 'lucide-react'
import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button, buttonClassName } from '@/ui'
import { getErrorMessage } from '@/utils/errors'
import { NotFoundPage } from './NotFoundPage'
import { StatusScreen } from './StatusScreen'

// Route errorElement. Nested inside the shell for page errors, and at the root (fullScreen)
// for errors in the layout itself, so a crash never leaves a blank screen.
export function RouteError({ fullScreen = false }: { fullScreen?: boolean }) {
  const error = useRouteError()

  useEffect(() => {
    console.error(error)
  }, [error])

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage fullScreen={fullScreen} />
  }

  return (
    <StatusScreen
      fullScreen={fullScreen}
      code="Ups"
      title="Algo salió mal"
      description="No perdiste nada: tus gastos están guardados en el dispositivo. Probá recargar."
      details={error instanceof Error ? (error.stack ?? error.message) : getErrorMessage(error)}
      actions={
        <>
          <Button size="lg" icon={<RotateCw aria-hidden />} onClick={() => location.reload()}>
            Recargar
          </Button>
          {/* A full reload to "/" also recovers when the layout itself is broken */}
          <Link
            to="/"
            reloadDocument
            className={buttonClassName({ size: 'lg', variant: 'secondary' })}
          >
            <House aria-hidden />
            Ir al inicio
          </Link>
        </>
      }
    />
  )
}
