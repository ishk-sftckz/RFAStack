import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hashPassword } from 'better-auth/crypto'
import { user, account } from '../backend/features/auth/auth.table'
import { membership } from '../backend/features/membership/membership.table'
import { shipment, product } from '../backend/features/fulfillment/fulfillment.table'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

try {
  const password = await hashPassword('Demo-password-123!')
  await db.transaction(async (tx) => {
    for (const name of ['north', 'south', 'supervisor']) {
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
        .values({
          userId: name,
          scopeId: `warehouse-${name === 'supervisor' ? 'north' : name}`,
          role: name === 'supervisor' ? 'supervisor' : 'operator',
        })
        .onConflictDoNothing()
    }
    for (const name of ['north', 'south']) {
      await tx
        .insert(shipment)
        .values({
          id: `shipment-${name}`,
          warehouseId: `warehouse-${name}`,
          customer: `${name} customer`,
          status: 'queued',
        })
        .onConflictDoNothing()
    }
    await tx
      .insert(product)
      .values([{ id: 'notebook', name: 'Notebook', price: 1200 }])
      .onConflictDoNothing()
  })
} finally {
  await pool.end()
}
