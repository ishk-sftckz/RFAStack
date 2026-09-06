import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { AccessError } from '@backend/shared/utils/errors'
import { shipment, event, outbox } from './fulfillment.table'

const eventSchema = z.object({
  eventId: z.string().min(1).max(100),
  shipmentId: z.string().min(1).max(100),
  status: z.literal('delivered'),
})

export async function receiveCarrierEvent(input: unknown) {
  const parsed = eventSchema.parse(input)

  return database.transaction(async (tx) => {
    const inserted = await tx
      .insert(event)
      .values({ id: parsed.eventId, shipmentId: parsed.shipmentId })
      .onConflictDoNothing()
      .returning()

    if (!inserted.length) {
      return { duplicate: true }
    }

    const [row] = await tx
      .update(shipment)
      .set({ status: 'delivered', updatedAt: new Date() })
      .where(and(eq(shipment.id, parsed.shipmentId), eq(shipment.status, 'dispatched')))
      .returning()

    if (!row) {
      throw new AccessError(409, 'Only dispatched shipments can be delivered.')
    }

    await tx
      .insert(outbox)
      .values({ id: randomUUID(), tag: `warehouse:${row.warehouseId}`, immediate: 0 })

    return { duplicate: false }
  })
}
