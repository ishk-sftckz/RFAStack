import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { traceRead } from '@/platform/observability/trace'
import { backend } from '@/platform/http/backend'
import { membershipSchema, type Membership } from './model/membership.schema'

export async function requireMembership(requestHeaders: Headers) {
  return membershipSchema.parse(await backend('/membership', requestHeaders))
}

export function withMembership<Args extends unknown[], Result>(
  operation: (member: Membership, ...args: Args) => Promise<Result>,
) {
  return async (requestHeaders: Headers, ...args: Args): Promise<Result> => {
    const member = await requireMembership(requestHeaders)
    return operation(member, ...args)
  }
}

export async function getPreferences() {
  'use cache: private'

  cacheLife({ stale: 30 })
  return getPreferencesForRequest(await headers())
}

const getPreferencesForRequest = withMembership(async (membership) => {
  cacheTag(`preferences:${membership.userId}`)
  traceRead('operator-preferences', membership.scopeId)

  return { preference: membership.preference, savedFilter: membership.savedFilter }
})
