import 'server-only'
import { readResult } from '@/platform/http/result'
import { backend } from '@/platform/http/backend'
import { requireMembership } from './membership.queries'
import { preferenceSchema } from './model/membership.schema'

export async function savePreferences(input: unknown, requestHeaders: Headers) {
  await requireMembership(requestHeaders)
  const value = preferenceSchema.parse(input)
  return readResult(
    await backend(requestHeaders)('/membership/preferences', { method: 'POST', body: value }),
  )
}
