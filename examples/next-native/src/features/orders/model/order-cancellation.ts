import type { OrderStatus } from './order.schema'

export function canCancel(status: OrderStatus) {
  return status === 'pending'
}
