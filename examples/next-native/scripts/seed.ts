import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hashPassword } from 'better-auth/crypto'
import { user, account, membership } from '../src/features/identity/server/identity.table'
import { product } from '../src/features/catalog/server/catalog.table'
import { order } from '../src/features/orders/server/order.table'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

try {
  const password = await hashPassword('Demo-password-123!')
  await db.transaction(async (tx) => {
    for (const name of ['alice', 'bob']) {
      await tx
        .insert(user)
        .values({ id: name, name, email: `${name}@example.test`, emailVerified: true })
        .onConflictDoNothing()
      await tx
        .insert(account)
        .values({ id: name, accountId: name, userId: name, providerId: 'credential', password })
        .onConflictDoNothing()
      await tx
        .insert(membership)
        .values({ userId: name, scopeId: `account-${name}`, role: 'customer' })
        .onConflictDoNothing()
      await tx
        .insert(order)
        .values({
          id: `order-${name}`,
          scopeId: `account-${name}`,
          status: 'pending',
          total: 1200,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          items: [{ productId: 'notebook', name: 'Notebook', price: 1200, quantity: 1 }],
        })
        .onConflictDoNothing()
    }
    await tx
      .insert(product)
      .values([
        { id: 'notebook', name: 'Notebook', price: 1200 },
        { id: 'pencils', name: 'Pencil set', price: 600 },
        { id: 'folder', name: 'Document folder', price: 800 },
      ])
      .onConflictDoNothing()
  })
  console.info('Seeded alice@example.test and bob@example.test')
} finally {
  await pool.end()
}
