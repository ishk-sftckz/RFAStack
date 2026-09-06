import { orders } from './order.client'

export const orderListOptions = (scopeId: string) =>
  orders.list.queryOptions({ input: { scopeId }, staleTime: 30000 })
