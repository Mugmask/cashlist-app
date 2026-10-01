import { useEffect, useState } from 'react'
import { Spinner } from '../Spinner/Spinner'
import styles from './PageLoader.module.css'

const DELAY_MS = 250 // local data usually takes a few ms: a spinner that flashes is worse than none

// What a screen shows until all its data is there, so its numbers appear once and in place
// instead of filling in one by one. Blank at first; the spinner shows only if it takes a while.
export function PageLoader() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return <div className={styles.loader}>{visible && <Spinner size={28} />}</div>
}
