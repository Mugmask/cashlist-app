import { Plus, ShoppingCart, Trash2, Zap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Alert,
  Amount,
  AmountField,
  Button,
  Card,
  ChipGroup,
  IconButton,
  ProgressBar,
  Stack,
  TextField,
} from '@/ui'
import styles from './UiPlayground.module.css'

// Dev-only catalog of the design system, served at /ui
export default function UiPlayground() {
  const [chip, setChip] = useState('groceries')
  const [amount, setAmount] = useState('12.500')

  return (
    <main className={styles.page}>
      <h1>Design system</h1>

      <Section title="Button">
        <Stack direction="row" gap={2} className={styles.wrap}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Stack>
        <Button size="lg" fullWidth icon={<Plus />}>
          Large full width
        </Button>
        <Stack direction="row" gap={2}>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </Stack>
      </Section>

      <Section title="IconButton">
        <Stack direction="row" gap={2}>
          <IconButton label="Borrar" icon={<Trash2 />} />
          <IconButton label="Agregar" icon={<Plus />} variant="secondary" />
        </Stack>
      </Section>

      <Section title="Amount">
        <Amount value={1234567.89} size="xl" />
        <Stack direction="row" gap={4} align="baseline" className={styles.wrap}>
          <Amount value={12500} size="lg" />
          <Amount value={12500} tone="accent" />
          <Amount value={12500} tone="muted" size="sm" />
          <Amount value={-3200} tone="danger" size="sm" />
        </Stack>
      </Section>

      <Section title="AmountField">
        <Card>
          <AmountField label="Monto" value={amount} onValueChange={setAmount} />
        </Card>
      </Section>

      <Section title="TextField">
        <TextField label="Email" placeholder="vos@mail.com" />
        <TextField label="Con ayuda" hint="Un texto de ayuda" />
        <TextField label="Con error" defaultValue="algo mal" error="Esto no es válido" />
      </Section>

      <Section title="ChipGroup">
        <ChipGroup
          label="Categoría"
          value={chip}
          onChange={setChip}
          options={[
            { value: 'groceries', label: 'Súper', icon: <ShoppingCart /> },
            { value: 'utilities', label: 'Servicios', icon: <Zap /> },
            { value: 'other', label: 'Otros' },
          ]}
        />
      </Section>

      <Section title="ProgressBar">
        <ProgressBar label="40%" value={40} max={100} />
        <ProgressBar label="85%" value={85} max={100} />
        <ProgressBar label="Excedido" value={130} max={100} />
      </Section>

      <Section title="Alert">
        <Alert>Un mensaje informativo.</Alert>
        <Alert tone="danger">No se pudo sincronizar.</Alert>
      </Section>

      <Section title="Card">
        <Card>Padding md</Card>
        <Card padding="lg">Padding lg</Card>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <Stack gap={3}>{children}</Stack>
    </section>
  )
}
