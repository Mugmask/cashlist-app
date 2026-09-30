import {
  CalendarCheck,
  House,
  type LucideIcon,
  Plus,
  ReceiptText,
  ShoppingBasket,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { cx } from '@/ui'
import styles from './BottomNav.module.css'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const LEFT_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/expenses', label: 'Movimientos', icon: ReceiptText },
]

const RIGHT_ITEMS: NavItem[] = [
  { to: '/fixed', label: 'Fijos', icon: CalendarCheck },
  { to: '/shopping', label: 'Compras', icon: ShoppingBasket },
]

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  return (
    <nav className={styles.nav} aria-label="Principal">
      <ul className={styles.bar}>
        {LEFT_ITEMS.map(renderItem)}
        <li className={styles.fabSlot}>
          <button type="button" className={styles.fab} aria-label="Cargar gasto" onClick={onAdd}>
            <Plus aria-hidden />
          </button>
        </li>
        {RIGHT_ITEMS.map(renderItem)}
      </ul>
    </nav>
  )
}

function renderItem({ to, label, icon: Icon }: NavItem) {
  return (
    <li key={to}>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) => cx(styles.item, isActive && styles.active)}
      >
        <Icon aria-hidden />
        <span>{label}</span>
      </NavLink>
    </li>
  )
}
