import 'server-only'
import { and, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { orderInputSchema } from '../model/order.schema'

export async function cancelOrder(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)
  const { orderId } = orderInputSchema.parse(input)
  const [current] = await database
    .select({ status: order.status })
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.scopeId, identity.scopeId)))

  if (!current) {
    throw new AccessError(404, 'Order not found.')
  }

  const changed = await database
    .update(order)
    .set({ status: 'cancelled' })
    .where(
      and(eq(order.id, orderId), eq(order.scopeId, identity.scopeId), eq(order.status, 'pending')),
    )
    .returning({ id: order.id })

  if (!changed.length) {
    throw new AccessError(409, 'Only pending orders can be cancelled.')
  }

  return identity.scopeId
}
