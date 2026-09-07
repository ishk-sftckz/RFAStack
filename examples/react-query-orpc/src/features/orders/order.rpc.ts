import 'server-only'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { procedure } from '@/platform/rpc/procedure'
import { requireMembership } from '@/features/membership/membership.queries'
import { AccessError } from '@/shared/utils/errors'
import { checkoutSchema } from '@/features/checkout/model/checkout.schema'
import { scopeSchema, decisionSchema } from './model/approval.schema'
import { orderSchema, orderInputSchema } from './model/order.schema'
import { listOrders, getOrder } from './order.queries'
import { createOrder } from './create-order.use-case'
import { decideOrder } from './decide-order.use-case'

export const orderRouter = {
  list: procedure
    .input(scopeSchema)
    .output(orderSchema.array())
    .handler(async ({ input, context }) => {
      const membership = await requireMembership(context.headers)

      if (membership.scopeId !== input.scopeId) {
        throw new AccessError(403, 'Company access denied.')
      }

      return listOrders(context.headers)
    }),
  details: procedure
    .input(orderInputSchema)
    .output(orderSchema)
    .handler(({ input, context }) => getOrder(context.headers, input)),
  submit: procedure
    .input(checkoutSchema)
    .output(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await createOrder(input, context.headers)
      revalidateTag(`orders:${result.scopeId}`, { expire: 0 })

      return { id: result.id }
    }),
  decide: procedure
    .input(decisionSchema)
    .output(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await decideOrder(input, context.headers)
      revalidateTag(`orders:${result.scopeId}`, { expire: 0 })

      return { id: result.id }
    }),
}
