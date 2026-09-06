import 'server-only'
import { orderRouter } from '@/features/orders/server/order.rpc'
import { catalogRouter } from '@/features/catalog/server/catalog.rpc'
import { identityRouter } from '@/features/identity/server/identity.rpc'

export const router = { orders: orderRouter, catalog: catalogRouter, identity: identityRouter }
