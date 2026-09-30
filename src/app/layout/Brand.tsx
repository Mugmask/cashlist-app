import styles from './Brand.module.css'

export function Brand() {
  return (
    <span className={styles.brand}>
      cash<span className={styles.accent}>list</span>
    </span>
  )
}
