import { test, expect, type Page } from '@playwright/test'

/**
 * Full-stack real-world journeys.
 *
 * Unlike reservation.spec.ts (which intercepts `/api/*`), these drive the real
 * stack end-to-end: React UI → API routes / server actions → the mock PostgREST
 * + Resend server in e2e/support/mock-supabase.mjs. This exercises validation,
 * the capacity-aware booking UI, the 409 path, admin auth, the confirm and
 * slot-block server actions, and logout — as a real user would.
 *
 * Runs on the single-instance `journeys` project (see playwright.config.ts) so
 * the mock has exactly one, serialized consumer. Password matches the config's
 * webServer env.
 */

const ADMIN_PASSWORD = 'e2e-admin-password'
const MOCK = 'http://localhost:5599'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ request }) => {
  await request.get(`${MOCK}/__mock/reset`)
})

async function pickFirstDay(page: Page) {
  const enabled = page.locator('[role="gridcell"] button:not([disabled])')
  if ((await enabled.count()) === 0) {
    await page.getByRole('button', { name: /next month/i }).click()
  }
  await enabled.first().click()
}

test('guest — booking, capacity-aware slots, 409, and language switch', async ({ page }) => {
  await test.step('J1: land on the German homepage', async () => {
    await page.goto('/de', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Willkommen bei/i })).toBeVisible()
  })

  await test.step('J2: browse the menu and switch category tabs', async () => {
    await page.getByRole('link', { name: 'Speisekarte' }).first().click()
    await page.getByRole('tab', { name: 'Hauptgerichte' }).click()
    await expect(page.getByRole('tab', { name: 'Hauptgerichte' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  await test.step('J3: open and close the gallery lightbox', async () => {
    await page.locator('#gallery button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  await test.step('J4: complete a booking against the empty 20:00 slot', async () => {
    await page.locator('#reservation').scrollIntoViewIfNeeded()
    await pickFirstDay(page)
    await page.getByRole('button', { name: /20:00\s*[–-]\s*22:00/ }).click()
    await page.getByPlaceholder('Ihr Name').fill('Lena Fischer')
    await page.getByPlaceholder('E-Mail-Adresse').fill('lena@example.de')
    await page.getByPlaceholder('Telefonnummer').fill('+49 7022 555 0100')
    await page.getByRole('button', { name: 'Jetzt reservieren' }).click()
    await expect(page.getByRole('heading', { name: 'Reservierung erhalten!' })).toBeVisible({
      timeout: 15000,
    })
  })

  await test.step('J5: party of 6 disables the near-full (15/20) 18:00 slot', async () => {
    await page.getByRole('button', { name: 'Weitere Reservierung' }).click()
    await pickFirstDay(page)
    const slot18 = page.getByRole('button', { name: /18:00\s*[–-]\s*20:00/ })
    await expect(slot18).toBeEnabled() // remaining 5 >= party 2
    await page.locator('#res-party').selectOption('6')
    await expect(slot18).toBeDisabled() // remaining 5 < party 6
  })

  await test.step('J6: a server 409 shows the specific message and refreshes availability', async () => {
    await page.locator('#res-party').selectOption('2')
    await page.getByRole('button', { name: /20:00\s*[–-]\s*22:00/ }).click()
    await page.getByPlaceholder('Ihr Name').fill('Tom Becker')
    await page.getByPlaceholder('E-Mail-Adresse').fill('tom@example.de')
    await page.getByPlaceholder('Telefonnummer').fill('+49 7022 555 0200')
    await page.request.get(`${MOCK}/__mock/fail-next-insert`) // arm one-shot 409
    await page.getByRole('button', { name: 'Jetzt reservieren' }).click()
    await expect(page.getByText(/soeben ausgebucht/)).toBeVisible({ timeout: 15000 })
  })

  await test.step('J7: switch language DE → EN', async () => {
    await page.goto('/de', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'EN', exact: true }).first().click()
    await page.waitForURL('**/en')
    await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible()
  })
})

test('admin — login, confirm reservation, block slot, and sign out', async ({ page }) => {
  await test.step('J8: a wrong password is rejected', async () => {
    await page.goto('/de/admin', { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Passwort').fill('wrong-password')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page.getByText('Falsches Passwort')).toBeVisible()
  })

  await test.step('J9: log in and see the reservation dashboard', async () => {
    await page.getByPlaceholder('Passwort').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page.getByRole('heading', { name: /Jilebi Admin/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Maria Müller')).toBeVisible()
    // Plan 4: the reservation with no delivery timestamp is flagged.
    await expect(page.getByText('E-Mail nicht zugestellt')).toBeVisible()
    // Plan 5: header controls exist.
    await expect(page.getByRole('link', { name: 'Alle anzeigen' })).toBeVisible()
  })

  await test.step('J10: confirm a pending reservation', async () => {
    await page.getByRole('button', { name: 'Bestätigen' }).first().click()
    // Maria's row flips to the confirmed badge.
    await expect(page.getByText('confirmed').first()).toBeVisible({ timeout: 10000 })
  })

  await test.step('J11: block a time slot in the slot manager', async () => {
    await page.getByRole('heading', { name: 'Zeitfenster' }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Sperren' }).first().click()
    await expect(page.getByText('Gesperrt').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Freigeben' }).first()).toBeVisible()
  })

  await test.step('J12: sign out returns to the login form', async () => {
    await page.getByRole('button', { name: 'Abmelden' }).click()
    await expect(page.getByPlaceholder('Passwort')).toBeVisible({ timeout: 10000 })
  })
})

test('mobile — hamburger nav exposes section links', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 780 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  await test.step('J13: open the mobile nav panel', async () => {
    await page.goto('/de', { waitUntil: 'networkidle' })
    const burger = page.locator('button[aria-controls="mobile-nav-panel"]')
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(
      page.locator('#mobile-nav-panel').getByRole('link', { name: 'Über uns' }),
    ).toBeVisible()
  })
  await context.close()
})
