import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { catalogRouter } from './server/catalog.rpc'

const client: RouterClient<{ catalog: typeof catalogRouter }> = createORPCClient(rpcLink)

export const catalog = createTanstackQueryUtils(client).catalog
