import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { membershipRouter } from './server/membership.rpc'

const client: RouterClient<{ membership: typeof membershipRouter }> = createORPCClient(rpcLink)

export const membershipRpc = createTanstackQueryUtils(client).membership
