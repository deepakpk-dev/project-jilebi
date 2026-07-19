import { test, expect } from '@playwright/test'

/**
 * End-to-end reservation flow.
 *
 * Strategy: intercept `/api/availability` and `/api/reservations` so we can
 * drive the full UI — React components, next-intl routing, form state,
 * navigation — without needing a live Supabase or Resend. The API routes
 * themselves are covered by unit tests under `src/app/api/**`.
 */

const MOCK_SLOTS = {
  slots: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      start_time: '18:00:00',
      end_time: '20:00:00',
      max_capacity: 20,
      booked: 0,
      available: true,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      start_time: '20:00:00',
      end_time: '22:00:00',
      max_capacity: 20,
      booked: 18,
      available: true,
    },
  ],
}

async function expectLocatorWithinViewport(locator: import('@playwright/test').Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(720)
}

async function pickFirstAvailableDay(page: import('@playwright/test').Page) {
  const enabledDays = page.locator('[role="gridcell"] button:not([disabled])')

  if ((await enabledDays.count()) === 0) {
    await page.getByRole('button', { name: /next month/i }).click()
  }

  await enabledDays.first().click()
}

test.describe('Hero section', () => {
  test('desktop CTAs are visible in the first viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop-only')

    await page.goto('/en')

    await expectLocatorWithinViewport(page.getByRole('link', { name: 'View Menu' }))
    await expectLocatorWithinViewport(page.getByRole('link', { name: 'Book a Table' }))
  })
})

test.describe('Reservation flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SLOTS),
      })
    })

    await page.route('**/api/reservations', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      const body = JSON.parse(route.request().postData() ?? '{}')
      expect(body).toMatchObject({
        name: expect.any(String),
        email: expect.stringMatching(/@/),
        phone: expect.any(String),
        party_size: expect.any(Number),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        time_slot_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        language: expect.stringMatching(/^(de|en)$/),
      })
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          reservation: { id: 'e2e-reservation', status: 'pending' },
        }),
      })
    })
  })

  test('a guest can complete a booking from start to success state', async ({ page }) => {
    await page.goto('/de')

    const reservationHeading = page.getByRole('heading', { name: /Einen Tisch buchen/i })
    await reservationHeading.scrollIntoViewIfNeeded()

    await pickFirstAvailableDay(page)

    // Time slot "18:00 – 20:00" appears once availability mock resolves
    await page.getByRole('button', { name: /18:00\s*[–-]\s*20:00/ }).click()

    await page.getByPlaceholder('Ihr Name').fill('Maria Müller')
    await page.getByPlaceholder('E-Mail-Adresse').fill('maria@example.de')
    await page.getByPlaceholder('Telefonnummer').fill('+49 7022 555 0123')

    await page.getByRole('button', { name: 'Jetzt reservieren' }).click()

    await expect(page.getByRole('heading', { name: 'Reservierung erhalten!' })).toBeVisible()
  })

  test('a capacity conflict shows a specific message and refreshes availability', async ({
    page,
  }) => {
    let availabilityCalls = 0
    let releaseConflict: (() => void) | undefined
    const conflictResponse = new Promise<void>((resolve) => {
      releaseConflict = resolve
    })
    await page.route('**/api/availability*', async (route) => {
      availabilityCalls++
      const slots =
        availabilityCalls === 1
          ? MOCK_SLOTS.slots
          : [
              { ...MOCK_SLOTS.slots[0], booked: 15, available: true },
              MOCK_SLOTS.slots[1],
            ]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slots }),
      })
    })
    await page.route('**/api/reservations', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await conflictResponse
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'This time slot is fully booked' }),
      })
    })

    await page.goto('/de')
    await pickFirstAvailableDay(page)
    await page.locator('#res-party').selectOption('6')
    await page.getByRole('button', { name: /18:00\s*[–-]\s*20:00/ }).click()
    await page.getByPlaceholder('Ihr Name').fill('Maria Müller')
    await page.getByPlaceholder('E-Mail-Adresse').fill('maria@example.de')
    await page.getByPlaceholder('Telefonnummer').fill('+49 7022 555 0123')

    const callsBefore = availabilityCalls
    await page.getByRole('button', { name: 'Jetzt reservieren' }).click()
    await expect(page.locator('#res-party')).toBeDisabled()
    releaseConflict?.()

    await expect(page.getByText(/soeben ausgebucht/)).toBeVisible()
    await expect.poll(() => availabilityCalls).toBeGreaterThan(callsBefore)
    await expect(page.getByRole('button', { name: /18:00\s*[–-]\s*20:00/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Jetzt reservieren' })).toBeDisabled()
  })

  test('fully-booked slots are visible but cannot be selected', async ({ page }) => {
    // Tighten the mock: mark the 20:00 slot as unavailable for this case
    await page.route('**/api/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: [
            { ...MOCK_SLOTS.slots[0] },
            { ...MOCK_SLOTS.slots[1], available: false, booked: 20 },
          ],
        }),
      })
    })

    await page.goto('/de')
    await pickFirstAvailableDay(page)

    const fullSlot = page.getByRole('button', { name: /20:00\s*[–-]\s*22:00/ })
    await expect(fullSlot).toBeDisabled()
  })
})

test.describe('Mobile navigation', () => {
  test('hamburger menu exposes section links and closes on navigate', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile-only')

    await page.goto('/de')

    const hamburger = page.locator('button[aria-controls="mobile-nav-panel"]')
    await expect(hamburger).toBeVisible()
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false')

    await hamburger.click()
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true')

    const mobileAboutLink = page
      .locator('#mobile-nav-panel')
      .getByRole('link', { name: 'Über uns' })
    await expect(mobileAboutLink).toBeVisible()

    await mobileAboutLink.click()
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })
})
