import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { traceRead } from '@/platform/observability/trace'
import { backend } from '@/platform/http/backend'
import { membershipSchema } from '../model/membership.schema'

export async function requireMembership(requestHeaders: Headers) {
  return membershipSchema.parse(await backend('/membership', requestHeaders))
}

export async function getPreferences() {
  'use cache: private'

  cacheLife({ stale: 30 })
  const membership = await requireMembership(await headers())
  cacheTag(`preferences:${membership.userId}`)
  traceRead('operator-preferences', membership.scopeId)

  return { preference: membership.preference, savedFilter: membership.savedFilter }
}
