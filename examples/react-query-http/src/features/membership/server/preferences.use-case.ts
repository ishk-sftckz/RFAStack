import 'server-only'
import { backend } from '@/platform/http/backend'
import { requireMembership } from './membership.queries'
import { preferenceSchema } from '../model/membership.schema'

export async function savePreferences(input: unknown, requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)
  const value = preferenceSchema.parse(input)
  await backend('/preferences', requestHeaders, { method: 'POST', body: JSON.stringify(value) })

  return membership.userId
}
