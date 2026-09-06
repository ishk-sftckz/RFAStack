import 'server-only'
import { and, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { requireMembership } from '@/features/membership/server/membership.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { orderInputSchema, orderStatusSchema } from '../model/order.schema'
import { canCancel } from '../model/order-cancellation'

export async function cancelOrder(input: unknown, requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)
  const { orderId } = orderInputSchema.parse(input)
  const [current] = await database
    .select({ status: order.status })
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.scopeId, membership.scopeId)))

  if (!current) {
    throw new AccessError(404, 'Order not found.')
  }

  if (!canCancel(orderStatusSchema.parse(current.status))) {
    throw new AccessError(409, 'Only pending orders can be cancelled.')
  }

  const changed = await database
    .update(order)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(order.id, orderId),
        eq(order.scopeId, membership.scopeId),
        eq(order.status, current.status),
      ),
    )
    .returning({ id: order.id })

  if (!changed.length) {
    throw new AccessError(409, 'Only pending orders can be cancelled.')
  }

  return membership.scopeId
}
