import { expect, test } from '@playwright/test'

test('opens in local mode, with no sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Modo local')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
})

test('every screen of the bottom nav opens', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Principal' })
  for (const [label, path] of [
    ['Gastos', '/expenses'],
    ['Fijos', '/fixed'],
    ['Compras', '/shopping'],
    ['Inicio', '/'],
  ]) {
    await nav.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})
