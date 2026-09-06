import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { identityRouter } from './server/identity.rpc'

const client: RouterClient<{ identity: typeof identityRouter }> = createORPCClient(rpcLink)

export const identityRpc = createTanstackQueryUtils(client).identity
