import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const shipment = pgTable('shipment', {
  id: text().primaryKey(),
  warehouseId: text().notNull(),
  customer: text().notNull(),
  status: text().notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
})

export const product = pgTable('product', {
  id: text().primaryKey(),
  name: text().notNull(),
  price: integer().notNull(),
})

export const event = pgTable('carrier_event', {
  id: text().primaryKey(),
  shipmentId: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})

export const outbox = pgTable('invalidation_outbox', {
  id: text().primaryKey(),
  tag: text().notNull(),
  immediate: integer().notNull().default(0),
})
