import { orders } from './order.rpc-client'

export const orderListOptions = (scopeId: string) =>
  orders.list.queryOptions({ input: { scopeId }, staleTime: 30000 })
