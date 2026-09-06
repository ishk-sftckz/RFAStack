import 'server-only'
import { orderRouter } from '@/features/orders/order.rpc'
import { catalogRouter } from '@/features/catalog/catalog.rpc'
import { membershipRouter } from '@/features/membership/membership.rpc'

export const router = { orders: orderRouter, catalog: catalogRouter, membership: membershipRouter }
