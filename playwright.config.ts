import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const MOCK_PORT = 5599

/**
 * Playwright E2E config.
 *
 * Two server processes are started:
 *  - `mock-supabase` (port 5599): a PostgREST + Resend stand-in so full-stack
 *    journeys can hit the real API routes without live services.
 *  - `next dev` (port 3100): pointed at the mock via env below.
 *
 * Two kinds of specs:
 *  - reservation.spec.ts intercepts `/api/*` at the browser layer and runs on
 *    the desktop + mobile projects.
 *  - journeys.spec.ts drives the real stack end-to-end (no interception) and
 *    runs on its own single-instance `journeys` project so the mock has exactly
 *    one, serialized consumer.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: /journeys\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testIgnore: /journeys\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'journeys',
      testMatch: /journeys\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node e2e/support/mock-supabase.mjs`,
      url: `http://localhost:${MOCK_PORT}/__mock/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npx next dev -p ${PORT}`,
      url: `http://localhost:${PORT}/de`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        // Point the real server-side clients at the mock.
        NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-role-key',
        RESEND_API_KEY: 'e2e-placeholder',
        RESEND_FROM_EMAIL: 'e2e@example.com',
        RESEND_BASE_URL: `http://localhost:${MOCK_PORT}`,
        ADMIN_PASSWORD: 'e2e-admin-password',
      },
    },
  ],
})
