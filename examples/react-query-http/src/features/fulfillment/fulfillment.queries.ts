import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { backend } from '@/platform/http/backend'
import { requireMembership } from '@/features/membership/membership.queries'
import { traceRead } from '@/platform/observability/trace'
import { shipmentSchema, productSchema, summarySchema } from './model/fulfillment.schema'

export async function listShipments(requestHeaders: Headers) {
  await requireMembership(requestHeaders)

  return shipmentSchema.array().parse(await backend('/shipments', requestHeaders))
}

export async function listCurrentProducts(requestHeaders: Headers) {
  await requireMembership(requestHeaders)

  return productSchema.array().parse(await backend('/products', requestHeaders))
}

export async function listProducts() {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag('catalog')
  traceRead('catalog')

  return productSchema.array().parse(await backend('/products'))
}

export async function getSummary(requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)

  return getCachedSummary(membership.scopeId)
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
