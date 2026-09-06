import 'server-only'
import { eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { AccessError } from '@/shared/utils/errors'
import { auth } from './auth'
import { membership } from './identity.table'
import { identitySchema } from '../model/identity.schema'

export async function requireIdentity(requestHeaders: Headers) {
  const current = await auth.api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  })

  if (!current) {
    throw new AccessError(401, 'Please sign in.')
  }

  const [member] = await database
    .select()
    .from(membership)
    .where(eq(membership.userId, current.user.id))

  if (!member) {
    throw new AccessError(403, 'No account access.')
  }

  return identitySchema.parse({ ...member, name: current.user.name })
}
