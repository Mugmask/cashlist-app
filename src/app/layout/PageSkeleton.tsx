import { Card, Skeleton, Stack, VisuallyHidden } from '@/ui'
import styles from './PageSkeleton.module.css'

// What shows right after signing in on a device without the data yet, until the first sync
// brings it: the shape of home (greeting, balance, two tiles, two lists), so the screen appears
// once and whole instead of filling in card by card.
export function PageSkeleton() {
  return (
    <Stack gap={6} className={styles.skeleton}>
      <VisuallyHidden role="status">Trayendo tus datos…</VisuallyHidden>
      <Stack gap={2}>
        <Skeleton width="45%" height={28} />
        <Skeleton width="35%" height={14} />
      </Stack>
      <Card variant="hero" padding="lg">
        <Stack gap={3}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="65%" height={44} />
          <Skeleton height={8} />
          <Stack gap={2}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="70%" height={14} />
          </Stack>
        </Stack>
      </Card>
      <div className={styles.tiles}>
        {[0, 1].map((i) => (
          <Card key={i}>
            <Stack gap={3}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="75%" height={26} />
              <Skeleton width="60%" height={12} />
            </Stack>
          </Card>
        ))}
      </div>
      <Section rows={3} />
      <Section rows={4} />
    </Stack>
  )
}

// A section of home: its title, and a card of rows (icon, name and detail, amount)
function Section({ rows }: { rows: number }) {
  return (
    <Stack gap={3}>
      <Skeleton width="38%" height={18} />
      <Card padding="none">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={styles.row}>
            <Skeleton width={40} height={40} round />
            <Stack gap={2} className={styles.rowText}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="30%" height={12} />
            </Stack>
            <Skeleton width={64} height={16} />
          </div>
        ))}
      </Card>
    </Stack>
  )
}
