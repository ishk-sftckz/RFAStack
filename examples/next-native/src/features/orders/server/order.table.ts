import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const order = pgTable('customer_order', {
  id: text().primaryKey(),
  scopeId: text().notNull(),
  status: text().notNull(),
  total: integer().notNull(),
  items: jsonb()
    .$type<Array<{ productId: string; name: string; price: number; quantity: number }>>()
    .notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
