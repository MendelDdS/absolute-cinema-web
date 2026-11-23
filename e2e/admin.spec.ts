import { expect, test } from '@playwright/test'

// Cobre o POST que responde 201 sem corpo + Location (contrato do catalog-service).
test('cadastra um filme e vê na lista', async ({ page }) => {
  await page.goto('/admin/movies')
  await page.getByLabel('Título').fill('Filme E2E')
  await page.getByLabel('Duração (minutos)').fill('95')
  await page.getByRole('button', { name: /cadastrar|salvar/i }).click()
  await expect(page.getByText('"Filme E2E" cadastrado.')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Filme E2E' })).toBeVisible()
})
