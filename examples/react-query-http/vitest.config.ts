import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('apps/web/src'),
      '@backend': resolve('apps/api/src'),
      'server-only': resolve('tests/server-only.ts'),
    },
  },
  test: { include: ['tests/*.test.ts'], fileParallelism: false },
})
