import { pgTable, text } from 'drizzle-orm/pg-core'
import { user } from '@/features/auth/server/auth.table'

// A business account is distinct from an authentication provider account.
export const membership = pgTable('membership', {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  scopeId: text().notNull(),
  role: text().notNull(),
  preference: text().notNull().default('standard'),
})
