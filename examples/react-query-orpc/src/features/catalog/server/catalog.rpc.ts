import 'server-only'
import { procedure } from '@/platform/rpc/procedure'
import { requireMembership } from '@/features/membership/server/membership.queries'
import { AccessError } from '@/shared/utils/errors'
import { z } from 'zod'
import { listProducts } from './catalog.queries'
import { productSchema } from '../model/catalog.schema'

export const catalogRouter = {
  list: procedure
    .input(z.object({ scopeId: z.string() }))
    .output(productSchema.array())
    .handler(async ({ input, context }) => {
      const membership = await requireMembership(context.headers)

      if (input.scopeId !== membership.scopeId) {
        throw new AccessError(403, 'Company access denied.')
      }

      return listProducts(context.headers)
    }),
}
