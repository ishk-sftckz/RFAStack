import 'server-only'
import { eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { requireIdentity } from './identity.queries'
import { membership } from './identity.table'
import { preferenceSchema } from '../model/identity.schema'

export async function savePreferences(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)
  const value = preferenceSchema.parse(input)
  await database.update(membership).set(value).where(eq(membership.userId, identity.userId))

  return identity
}
