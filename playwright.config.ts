import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

/**
 * Playwright E2E config.
 * Spins up `next dev` on port 3100 with placeholder Supabase creds — the
 * specs intercept `/api/*` so no real backend is needed.
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
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/de`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'e2e-placeholder-service-role-key',
      RESEND_API_KEY: 'e2e-placeholder',
      RESEND_FROM_EMAIL: 'e2e@example.com',
      ADMIN_PASSWORD: 'e2e-placeholder',
    },
  },
})
