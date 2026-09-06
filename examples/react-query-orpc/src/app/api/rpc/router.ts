import 'server-only'
import { orderRouter } from '@/features/orders/server/order.rpc'
import { catalogRouter } from '@/features/catalog/server/catalog.rpc'
import { membershipRouter } from '@/features/membership/server/membership.rpc'

export const router = { orders: orderRouter, catalog: catalogRouter, membership: membershipRouter }
