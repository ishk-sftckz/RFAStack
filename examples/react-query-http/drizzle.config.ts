import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/api/src/features/**/*.table.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
