import { expect, test, type Page } from '@playwright/test'

async function openFirstSession(page: Page) {
  await page.goto('/')
  await page
    .getByRole('link', { name: /sess(ão|ões)/ })
    .first()
    .click()
  await page.getByRole('link', { name: 'Escolher assentos' }).first().click()
  await expect(page).toHaveURL(/\/sessions\/.+\/seats/)
  await expect(page.getByRole('button', { name: /^Assento .*disponível$/ }).first()).toBeVisible()
}

async function reserveTwoSeats(page: Page) {
  await openFirstSession(page)
  // E5 é o assento "disputado" do mock; evitamos ele aqui.
  const available = page.getByRole('button', { name: /^Assento (?!E5,).*disponível$/ })
  await available.first().click()
  await available.first().click()
  await expect(page.getByRole('button', { name: /selecionado$/ })).toHaveCount(2)
  await page.getByRole('button', { name: /^Reservar/ }).click()
  await expect(page).toHaveURL(/\/bookings\/.+\/checkout/)
  await expect(page.getByRole('timer')).toHaveText(/\d\d:\d\d/)
}

test('compra: escolher assentos → reservar → pagar → ver ingressos', async ({ page }) => {
  await reserveTwoSeats(page)
  await page.getByText('Cartão de teste — aprovar').click()
  await page.getByRole('button', { name: /^Pagar/ }).click()
  await expect(page).toHaveURL(/\/status$/)
  await expect(page.getByRole('heading', { name: 'Processando pagamento…' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('link', { name: 'Ver ingressos' }).click()
  await expect(page.getByRole('heading', { name: 'Meus ingressos' })).toBeVisible()
  await expect(page.getByTestId('ticket')).toHaveCount(2)
  await expect(page.getByTestId('ticket').first().locator('svg')).toBeVisible()
})

test('pagamento recusado cancela a reserva', async ({ page }) => {
  await reserveTwoSeats(page)
  await page.getByText('Cartão de teste — recusar').click()
  await page.getByRole('button', { name: /^Pagar/ }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('link', { name: 'Escolher assentos novamente' }).click()
  await expect(page).toHaveURL(/\/sessions\/.+\/seats/)
})

test('409 ao reservar assento tomado por outro cliente', async ({ page }) => {
  await openFirstSession(page)
  await page.getByRole('button', { name: 'Assento E5, disponível' }).click()
  await page.getByRole('button', { name: /^Reservar/ }).click()
  await expect(page.getByText(/E5 acabou de ser reservado/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^Assento E5, reservado por outro cliente/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /selecionado$/ })).toHaveCount(0)
  await expect(page).toHaveURL(/\/seats$/)
})
