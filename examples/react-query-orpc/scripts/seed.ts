import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hashPassword } from 'better-auth/crypto'
import { user, account } from '../src/features/auth/server/auth.table'
import { membership } from '../src/features/membership/server/membership.table'
import { product } from '../src/features/catalog/server/catalog.table'
import { order } from '../src/features/orders/server/order.table'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

try {
  const password = await hashPassword('Demo-password-123!')
  await db.transaction(async (tx) => {
    for (const [name, scopeId, role] of [
      ['alice', 'company-a', 'buyer'],
      ['approver-a', 'company-a', 'approver'],
      ['bob', 'company-b', 'buyer'],
      ['approver-b', 'company-b', 'approver'],
    ]) {
      await tx
        .insert(user)
        .values({ id: name, name, email: `${name}@example.test`, emailVerified: true })
        .onConflictDoNothing()
      await tx
        .insert(account)
        .values({ id: name, accountId: name, userId: name, providerId: 'credential', password })
        .onConflictDoNothing()
      await tx.insert(membership).values({ userId: name, scopeId, role }).onConflictDoNothing()
    }
    for (const suffix of ['a', 'b']) {
      await tx
        .insert(product)
        .values({
          id: `notebook-${suffix}`,
          name: `Company ${suffix.toUpperCase()} notebook`,
          price: suffix === 'a' ? 1000 : 900,
          scopeId: `company-${suffix}`,
        })
        .onConflictDoNothing()
      await tx
        .insert(order)
        .values({
          id: `purchase-${suffix}`,
          scopeId: `company-${suffix}`,
          status: 'submitted',
          total: 1000,
          items: [
            {
              productId: `notebook-${suffix}`,
              name: `Company ${suffix} notebook`,
              price: 1000,
              quantity: 1,
            },
          ],
        })
        .onConflictDoNothing()
    }
  })
} finally {
  await pool.end()
}
