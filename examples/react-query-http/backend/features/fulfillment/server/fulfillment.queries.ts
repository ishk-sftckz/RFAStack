import { asc, eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { requireIdentity } from '@backend/features/identity/server/identity.queries'
import { shipment, product } from './fulfillment.table'
import { shipmentSchema, productSchema } from '../model/fulfillment.schema'

export async function listShipments(requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  return shipmentSchema
    .array()
    .parse(
      await database
        .select()
        .from(shipment)
        .where(eq(shipment.warehouseId, identity.scopeId))
        .orderBy(asc(shipment.id)),
    )
}

export async function listProducts() {
  return productSchema.array().parse(await database.select().from(product).orderBy(asc(product.id)))
}
// Integration-only read. The HTTP boundary verifies the service credential.
export async function getWarehouseSummary(scopeId: string) {
  const rows = await database
    .select({ status: shipment.status })
    .from(shipment)
    .where(eq(shipment.warehouseId, scopeId))

  return {
    warehouseId: scopeId,
    total: rows.length,
    dispatched: rows.filter((row) => row.status === 'dispatched').length,
  }
}
