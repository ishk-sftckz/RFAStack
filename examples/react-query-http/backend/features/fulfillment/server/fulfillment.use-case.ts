import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { requireIdentity } from '@backend/features/identity/server/identity.queries'
import { AccessError } from '@backend/shared/utils/errors'
import { shipment, product, outbox } from './fulfillment.table'
import { transitionSchema, priceSchema } from '../model/fulfillment.schema'

export async function transitionShipment(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)
  const parsed = transitionSchema.parse(input)
  await database.transaction(async (tx) => {
    const [exists] = await tx
      .select()
      .from(shipment)
      .where(and(eq(shipment.id, parsed.id), eq(shipment.warehouseId, identity.scopeId)))

    if (!exists) {
      throw new AccessError(404, 'Shipment not found.')
    }

    const rows = await tx
      .update(shipment)
      .set({ status: parsed.status, updatedAt: new Date() })
      .where(
        and(
          eq(shipment.id, parsed.id),
          eq(shipment.warehouseId, identity.scopeId),
          eq(shipment.status, parsed.status === 'packed' ? 'queued' : 'packed'),
        ),
      )
      .returning()

    if (!rows.length) {
      throw new AccessError(409, 'The shipment has already changed. Refresh the queue.')
    }

    await tx
      .insert(outbox)
      .values({ id: randomUUID(), tag: `warehouse:${identity.scopeId}`, immediate: 1 })
  })

  return { tag: `warehouse:${identity.scopeId}` }
}

export async function updatePrice(input: unknown, requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  if (identity.role !== 'supervisor') {
    throw new AccessError(403, 'Supervisor access required.')
  }

  const parsed = priceSchema.parse(input)
  await database.transaction(async (tx) => {
    const rows = await tx
      .update(product)
      .set({ price: parsed.price })
      .where(eq(product.id, parsed.id))
      .returning()

    if (!rows.length) {
      throw new AccessError(404, 'Product not found.')
    }

    await tx.insert(outbox).values({ id: randomUUID(), tag: 'catalog', immediate: 1 })
  })

  return { tag: 'catalog' }
}
