import { expect, test } from '@playwright/test'

test('adds an expense and lists it', async ({ page }) => {
  await page.goto('/expenses')
  await page.getByRole('button', { name: 'Cargar gasto' }).click()

  const sheet = page.getByRole('dialog')
  await sheet.getByLabel('Monto').fill('1500')
  await sheet.getByLabel('Nombre (opcional)').fill('Café E2E')
  await sheet.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Gasto guardado')).toBeVisible()
  await expect(page.getByText('Café E2E')).toBeVisible()
})
