import 'server-only'
import type { order } from './order.table'
import { orderSchema } from '../model/order.schema'

export function toOrderDto(row: typeof order.$inferSelect) {
  return orderSchema.parse({
    id: row.id,
    status: row.status,
    total: row.total,
    items: row.items,
    createdAt: row.createdAt.toISOString(),
  })
}
