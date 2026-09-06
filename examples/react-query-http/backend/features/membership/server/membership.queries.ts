import { eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { AccessError } from '@backend/shared/utils/errors'
import { requireSession } from '@backend/features/auth/server/auth.queries'
import { membership } from './membership.table'
import { membershipSchema } from '../model/membership.schema'

export async function requireMembership(requestHeaders: Headers) {
  const current = await requireSession(requestHeaders)

  const [member] = await database
    .select()
    .from(membership)
    .where(eq(membership.userId, current.userId))

  if (!member) {
    throw new AccessError(403, 'No account access.')
  }

  return membershipSchema.parse({ ...member, name: current.name })
}
