import 'server-only'
import { randomUUID } from 'node:crypto'
import { database } from '@/platform/database/client'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { listCurrentProducts } from '@/features/catalog/server/catalog.queries'
import { AccessError } from '@/shared/utils/errors'
import { order } from './order.table'
import { checkoutSchema } from '@/features/checkout/model/checkout.schema'

export async function createOrder(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)
  const parsed = checkoutSchema.parse(input)
  const products = await listCurrentProducts(requestHeaders)
  const items = parsed.items.map((item) => {
    const found = products.find((product) => product.id === item.productId)

    if (!found) {
      throw new AccessError(400, 'Product unavailable.')
    }

    return { productId: found.id, name: found.name, price: found.price, quantity: item.quantity }
  })
  const id = randomUUID()
  await database.transaction(async (tx) => {
    await tx.insert(order).values({
      id,
      scopeId: identity.scopeId,
      status: 'pending',
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items,
    })
  })

  return { id, scopeId: identity.scopeId }
}
