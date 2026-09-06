import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { and, desc, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { orderInputSchema, orderSchema } from '../model/order.schema'

const dto = (row: typeof order.$inferSelect) =>
  orderSchema.parse({ ...row, createdAt: row.createdAt.toISOString() })

export async function listOrders(requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  return listCachedOrders(identity.scopeId)
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
  ).map(dto)
}

export async function getOrder(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)
  const { orderId } = orderInputSchema.parse(input)
  traceRead('order-detail', identity.scopeId)
  const [row] = await database
    .select()
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.scopeId, identity.scopeId)))

  if (!row) {
    throw new AccessError(404, 'Order not found.')
  }

  return dto(row)
}

export const getOrderForRender = cache(async (orderId: string) =>
  getOrder({ orderId }, await headers()),
)
