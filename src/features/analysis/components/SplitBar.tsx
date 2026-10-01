import styles from './SplitBar.module.css'

export interface SplitPart {
  key: string
  label: string
  value: number
  color: string // a CSS color: its category's, or the chart gray for context
}

// Part to whole as one bar cut in colored segments (a 2px gap between them), and under it
// each part with its color and share, so nothing relies on the colors alone. What a pie
// would say, in one line, and easier to compare.
export function SplitBar({ label, parts }: { label: string; parts: readonly SplitPart[] }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  const shown = parts.filter((p) => p.value > 0)
  const share = (p: SplitPart) => (total > 0 ? Math.round((p.value / total) * 100) : 0)

  return (
    <div className={styles.split}>
      <div
        className={styles.bar}
        role="img"
        aria-label={`${label}: ${shown.map((p) => `${p.label} ${share(p)}%`).join(', ')}`}
      >
        {shown.map((p) => (
          <span
            key={p.key}
            className={styles.segment}
            style={{ flexGrow: p.value, background: p.color }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {shown.map((p) => (
          <li key={p.key} className={styles.item}>
            <span className={styles.swatch} style={{ background: p.color }} aria-hidden />
            <span className={styles.label}>{p.label}</span>
            <span className={styles.share}>{share(p)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
