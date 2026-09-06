import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './backend/features/**/server/*.table.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
