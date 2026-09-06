import { beforeAll, afterAll, expect, test } from 'vitest'
import { eq } from 'drizzle-orm'
import { authProvider } from '@/features/auth/auth.provider'
import { database, pool } from '@/platform/database/client'
import { order } from '@/features/orders/order.table'
import { cancelOrder } from '@/features/orders/cancel-order.use-case'
import { createOrder } from '@/features/orders/create-order.use-case'

let alice: Headers
let bob: Headers

async function sessionFor(email: string) {
  const response = await authProvider.api.signInEmail({
    body: { email, password: 'Demo-password-123!' },
    asResponse: true,
  })

  return new Headers({
    cookie: response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; '),
  })
}

beforeAll(async () => {
  alice = await sessionFor('alice@example.test')
  bob = await sessionFor('bob@example.test')
})

afterAll(async () => {
  await pool.end()
})

test('forged accounts and prices cannot change checkout authority', async () => {
  const result = await createOrder(
    { scopeId: 'account-bob', items: [{ productId: 'notebook', quantity: 2, price: 1 }] },
    alice,
  )
  const [stored] = await database.select().from(order).where(eq(order.id, result.id))
  expect(stored.scopeId).toBe('account-alice')
  expect(stored.total).toBe(2400)
  await expect(cancelOrder({ orderId: result.id }, bob)).rejects.toMatchObject({ status: 404 })
})

test('a cancellation cannot overwrite fulfillment and repeat cancellation conflicts', async () => {
  const created = await createOrder({ items: [{ productId: 'notebook', quantity: 1 }] }, alice)
  await database.update(order).set({ status: 'shipped' }).where(eq(order.id, created.id))
  await expect(cancelOrder({ orderId: created.id }, alice)).rejects.toMatchObject({ status: 409 })
  const fresh = await createOrder({ items: [{ productId: 'notebook', quantity: 1 }] }, alice)
  const results = await Promise.allSettled([
    cancelOrder({ orderId: fresh.id }, alice),
    cancelOrder({ orderId: fresh.id }, alice),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
})

test('invalid input and missing sessions are rejected', async () => {
  await expect(createOrder({ items: [] }, alice)).rejects.toThrow()
  await expect(
    createOrder({ items: [{ productId: 'notebook', quantity: 1 }] }, new Headers()),
  ).rejects.toMatchObject({ status: 401 })
})
