import { Moon, SunMedium } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ChipGroup } from '@/ui'
import { applyTheme, readTheme, THEMES, type Theme } from '../theme'

const ICONS: Record<Theme, ReactNode> = {
  dark: <Moon aria-hidden />,
  light: <SunMedium aria-hidden />,
}

// Light or dark: applied on tap, like the color, so the sheet itself is the preview
export function ThemePicker() {
  const [theme, setTheme] = useState(readTheme)

  function handleChange(next: Theme) {
    setTheme(next)
    applyTheme(next)
  }

  return (
    <ChipGroup
      label="Tema"
      showLabel
      options={THEMES.map(({ value, label }) => ({ value, label, icon: ICONS[value] }))}
      value={theme}
      onChange={handleChange}
    />
  )
}
