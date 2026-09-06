import { eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { requireMembership } from './membership.queries'
import { membership } from './membership.table'
import { preferenceSchema } from './model/membership.schema'

export async function savePreferences(input: unknown, requestHeaders: Headers) {
  const member = await requireMembership(requestHeaders)
  const value = preferenceSchema.parse(input)
  await database.update(membership).set(value).where(eq(membership.userId, member.userId))

  return member
}
