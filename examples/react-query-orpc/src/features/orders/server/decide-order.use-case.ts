import 'server-only'
import { and, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { decisionSchema } from '../model/approval.schema'

export async function decideOrder(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  if (identity.role !== 'approver') {
    throw new AccessError(403, 'Approver access required.')
  }

  const parsed = decisionSchema.parse(input)
  const [current] = await database
    .select()
    .from(order)
    .where(and(eq(order.id, parsed.orderId), eq(order.scopeId, identity.scopeId)))

  if (!current) {
    throw new AccessError(404, 'Purchase order not found.')
  }

  const rows = await database
    .update(order)
    .set({ status: parsed.decision })
    .where(
      and(
        eq(order.id, parsed.orderId),
        eq(order.scopeId, identity.scopeId),
        eq(order.status, 'submitted'),
      ),
    )
    .returning()

  if (!rows.length) {
    throw new AccessError(409, 'This purchase order has already been decided.')
  }

  return { id: parsed.orderId, scopeId: identity.scopeId }
}
