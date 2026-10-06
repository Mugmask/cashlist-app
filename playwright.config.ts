import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// E2E against the production build in local mode: the Supabase env is blanked out (it wins
// over .env.local), so the app runs with no account and no sync and never touches the real DB
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Mobile-first app: tested at phone size
    ...devices['Pixel 7'],
    // The service worker would serve cached builds between runs
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec vite build --outDir dist-e2e --logLevel warn && pnpm exec vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
