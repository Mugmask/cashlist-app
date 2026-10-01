import { ArrowLeft } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import styles from './BackLink.module.css'
import type { BackTarget } from './useBackTarget'

// "← Inicio" above the screen's title. When the previous screen is in history it goes back
// through it (so filters and scroll come back as they were); else it's a plain link.
export function BackLink({ target }: { target: BackTarget }) {
  const navigate = useNavigate()

  const goBack = (event: MouseEvent) => {
    if (!target.steps) return
    event.preventDefault()
    navigate(-target.steps)
  }

  return (
    <nav aria-label="Volver">
      <Link to={target.href} className={styles.link} onClick={goBack}>
        <ArrowLeft aria-hidden />
        {target.title}
      </Link>
    </nav>
  )
}
