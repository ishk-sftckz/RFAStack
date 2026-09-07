import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
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

export const getOrder = withMembership(async ({ scopeId }, input: unknown) => {
  const { orderId } = orderInputSchema.parse(input)
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
