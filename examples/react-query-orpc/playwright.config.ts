import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:3103', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run db:migrate && bun run db:reset && bun run build && bun run start',
    url: 'http://localhost:3103',
    reuseExistingServer: false,
    timeout: 180000,
    env: { CACHE_TRACE: '1', E2E_TEST: '1', CACHE_TRACE_FILE: 'test-results/cache-trace.jsonl' },
  },
})
