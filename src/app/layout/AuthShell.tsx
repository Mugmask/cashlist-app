import { ShieldCheck } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import styles from './AuthShell.module.css'
import { setDocumentTitle } from './usePageNavigation'

// Signed-out screen: the brand front and center on a soft glow, the form below it
export function AuthShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    setDocumentTitle('Entrar')
  }, [])

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" className={styles.logo} width={80} height={80} />
          <p className={styles.wordmark}>
            cash<span className={styles.accent}>list</span>
          </p>
          <p className={styles.tagline}>Tus gastos, tus fijos y el súper, bajo control.</p>
        </div>

        {children}

        <p className={styles.footer}>
          <ShieldCheck aria-hidden />
          Tus datos se guardan en tu cuenta y se sincronizan entre tus dispositivos.
        </p>
      </main>
    </div>
  )
}
