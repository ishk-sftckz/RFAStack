import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { and, desc, eq } from 'drizzle-orm'
import { fetchDeliveryEstimate } from '@/platform/carrier/client'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { withMembership } from '@/features/membership/membership.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { orderInputSchema } from './model/order.schema'
import { toOrderDto } from './order.dto'

export const listOrders = withMembership(({ scopeId }) => listCachedOrders(scopeId))

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

const getOrderForRequest = withMembership(async ({ scopeId }, orderId: string) => {
  orderInputSchema.parse({ orderId })
  traceRead('order-detail', scopeId)
  const [row] = await database
    .select()
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.scopeId, scopeId)))

  if (!row) {
    throw new AccessError(404, 'Order not found.')
  }

  return toOrderDto(row)
})

export const getOrder = cache(async (orderId: string) =>
  getOrderForRequest(await headers(), orderId),
)

export const getDeliveryEstimate = withMembership(() => fetchDeliveryEstimate())
