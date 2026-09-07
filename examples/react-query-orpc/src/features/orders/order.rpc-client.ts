import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { orderRouter } from './order.rpc'

export const orderClient: RouterClient<{ orders: typeof orderRouter }> = createORPCClient(rpcLink)

export const orders = createTanstackQueryUtils(orderClient).orders
