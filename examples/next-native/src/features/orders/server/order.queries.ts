import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { fetchDeliveryEstimate } from '@/platform/carrier/client'
import { and, desc, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { requireMembership } from '@/features/membership/server/membership.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { orderInputSchema } from '../model/order.schema'
import { toOrderDto } from './order.dto'

export async function listOrders(requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)

  return listCachedOrders(membership.scopeId)
}

async function listCachedOrders(scopeId: string) {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`orders:${scopeId}`)
  traceRead('orders', scopeId)

  return (
    await database
      .select()
      .from(order)
      .where(eq(order.scopeId, scopeId))
      .orderBy(desc(order.createdAt))
  ).map(toOrderDto)
}

export const getOrder = cache(async (orderId: string) => {
  const membership = await requireMembership(await headers())
  orderInputSchema.parse({ orderId })
  traceRead('order-detail', membership.scopeId)
  const [row] = await database
    .select()
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.scopeId, membership.scopeId)))

  if (!row) {
    throw new AccessError(404, 'Order not found.')
  }

  return toOrderDto(row)
})

export async function getDeliveryEstimate(requestHeaders: Headers) {
  await requireMembership(requestHeaders)

  return fetchDeliveryEstimate()
}
