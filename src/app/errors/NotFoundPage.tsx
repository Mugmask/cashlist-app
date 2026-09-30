import { House } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClassName } from '@/ui'
import { StatusScreen } from './StatusScreen'

export function NotFoundPage({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <StatusScreen
      fullScreen={fullScreen}
      code="404"
      title="Esta página no existe"
      description="Puede que el link esté mal o que la página se haya movido."
      actions={
        <Link to="/" className={buttonClassName({ size: 'lg' })}>
          <House aria-hidden />
          Volver al inicio
        </Link>
      }
    />
  )
}
