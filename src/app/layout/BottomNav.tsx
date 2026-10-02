import {
  CalendarCheck,
  House,
  type LucideIcon,
  Plus,
  ReceiptText,
  ShoppingBasket,
} from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { useAddExpense } from '@/features/expenses'
import { cx, useCurrentPrimaryAction } from '@/ui'
import styles from './BottomNav.module.css'
import { BAR_SHAPE, notchedBarPath } from './notchedBar'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const LEFT_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/expenses', label: 'Gastos', icon: ReceiptText },
]

const RIGHT_ITEMS: NavItem[] = [
  { to: '/fixed', label: 'Fijos', icon: CalendarCheck },
  { to: '/shopping', label: 'Compras', icon: ShoppingBasket },
]

// Screens the bar takes to directly: they need no way back, the bar is right there
export const NAV_PATHS = new Set([...LEFT_ITEMS, ...RIGHT_ITEMS].map((item) => item.to))

// The bar's current width, measured before paint and kept up to date (rotation, resizing)
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

// Frosted glass bar with the + button sunk into a notch. The notch is a path computed for the
// real width: it clips the glass and draws the hairline edge, so both always line up.
export function BottomNav() {
  const addExpense = useAddExpense()
  // The + does what the current screen needs (a fixed expense in Fijos...); by default, an expense
  const action = useCurrentPrimaryAction() ?? { label: 'Cargar gasto', run: addExpense }
  const [dockRef, width] = useWidth()
  // For the SVG's filter and mask: url(#…) wants a plain id, without useId's punctuation
  const ids = `nav${useId().replace(/[^a-z0-9]/gi, '')}`
  const path = width > 0 ? notchedBarPath({ ...BAR_SHAPE, width }) : null

  return (
    <nav className={styles.nav} aria-label="Principal">
      <div
        ref={dockRef}
        className={styles.dock}
        style={{ '--notch-center-y': `${BAR_SHAPE.notchCenterY}px` } as CSSProperties}
      >
        {path && (
          <>
            <div className={styles.glass} style={{ clipPath: `path('${path}')` }} aria-hidden />
            <svg
              className={styles.edge}
              width={width}
              height={BAR_SHAPE.height}
              viewBox={`0 0 ${width} ${BAR_SHAPE.height}`}
              aria-hidden
            >
              {/* The shadow, here rather than as a filter on the dock: a filter there would
                  cut the glass's backdrop-filter off from the page, so it'd blur nothing.
                  SVG filters before it masks, so the mask leaves only the shadow outside. */}
              <defs>
                <filter id={`${ids}-shadow`} x="-20%" y="-50%" width="140%" height="250%">
                  <feDropShadow dx="0" dy="6" stdDeviation="10" className={styles.shadowFlood} />
                </filter>
                <mask
                  id={`${ids}-outside`}
                  maskUnits="userSpaceOnUse"
                  x={-60}
                  y={-60}
                  width={width + 120}
                  height={BAR_SHAPE.height + 120}
                >
                  <rect
                    x={-60}
                    y={-60}
                    width={width + 120}
                    height={BAR_SHAPE.height + 120}
                    fill="white"
                  />
                  <path d={path} fill="black" />
                </mask>
              </defs>
              <path
                d={path}
                className={styles.shadow}
                filter={`url(#${ids}-shadow)`}
                mask={`url(#${ids}-outside)`}
              />
              <path d={path} className={styles.edgeLine} />
            </svg>
          </>
        )}
        <ul className={styles.bar}>
          {LEFT_ITEMS.map(renderItem)}
          {/* Keeps its column in the grid; the button itself sits centered in the notch */}
          <li>
            <button
              type="button"
              className={styles.fab}
              aria-label={action.label}
              onClick={action.run}
            >
              <Plus aria-hidden />
            </button>
          </li>
          {RIGHT_ITEMS.map(renderItem)}
        </ul>
      </div>
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
