import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { backend } from '@/platform/http/backend'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { traceRead } from '@/platform/observability/trace'
import { shipmentSchema, productSchema, summarySchema } from '../model/fulfillment.schema'

export async function listShipments(requestHeaders: Headers) {
  await requireIdentity(requestHeaders)

  return shipmentSchema.array().parse(await backend('/shipments', requestHeaders))
}

export async function listProducts() {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag('catalog')
  traceRead('catalog')

  return productSchema.array().parse(await backend('/products'))
}

export async function getSummary(requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  return getCachedSummary(identity.scopeId)
}

async function getCachedSummary(scopeId: string) {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`warehouse:${scopeId}`)
  traceRead('warehouse-summary', scopeId)

  return summarySchema.parse(
    await backend(`/internal/summary/${encodeURIComponent(scopeId)}`, new Headers(), {
      headers: { Authorization: `Bearer ${process.env.INTEGRATION_SECRET}` },
    }),
  )
}

export async function getOperatorPreferences() {
  'use cache: private'

  cacheLife({ stale: 30 })
  const identity = await requireIdentity(await headers())
  cacheTag(`preferences:${identity.userId}`)
  traceRead('operator-preferences', identity.scopeId)

  return { preference: identity.preference, savedFilter: identity.savedFilter }
}
