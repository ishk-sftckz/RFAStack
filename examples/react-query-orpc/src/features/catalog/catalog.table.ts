import { pgTable, text, integer } from 'drizzle-orm/pg-core'

export const product = pgTable('product', {
  id: text().primaryKey(),
  name: text().notNull(),
  price: integer().notNull(),
  scopeId: text().notNull().default('public'),
})
