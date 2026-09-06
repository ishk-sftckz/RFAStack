import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { database } from '@/platform/database/client'
import { user, session, account, verification } from './identity.table'

export const auth = betterAuth({
  // Production tests exercise many logins from one loopback IP.
  rateLimit: { enabled: process.env.E2E_TEST !== '1' },
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { cookieCache: { enabled: false } },
  advanced: { cookiePrefix: 'rfa-b2b' },
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
})
