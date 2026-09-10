import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { readResult } from '@/platform/http/result'
import { backend } from '@/platform/http/backend'
import { requireMembership, withMembership } from '@/features/membership/membership.queries'
import { traceRead } from '@/platform/observability/trace'
import { shipmentSchema, productSchema, summarySchema } from './model/fulfillment.schema'

export async function listShipments(requestHeaders: Headers) {
  await requireMembership(requestHeaders)

  return shipmentSchema
    .array()
    .parse(readResult(await backend(requestHeaders)('/fulfillment/shipments', { method: 'GET' })))
}

export async function listCurrentProducts(requestHeaders: Headers) {
  await requireMembership(requestHeaders)

  return productSchema
    .array()
    .parse(readResult(await backend(requestHeaders)('/fulfillment/products', { method: 'GET' })))
}

export async function listProducts() {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag('catalog')
  traceRead('catalog')

  return productSchema
    .array()
    .parse(readResult(await backend()('/fulfillment/products', { method: 'GET' })))
}

export const getSummary = withMembership(({ scopeId }) => getCachedSummary(scopeId))

async function getCachedSummary(scopeId: string) {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`warehouse:${scopeId}`)
  traceRead('warehouse-summary', scopeId)

  return summarySchema.parse(
    readResult(
      await backend()('/internal/summary/:scopeId', {
        method: 'GET',
        params: { scopeId },
        headers: { Authorization: `Bearer ${process.env.INTEGRATION_SECRET}` },
      }),
    ),
  )
}
