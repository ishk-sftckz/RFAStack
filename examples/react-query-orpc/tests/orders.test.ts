import { beforeAll, afterAll, expect, test } from 'vitest'
import { auth } from '@/features/identity/server/auth'
import { pool } from '@/platform/database/client'
import { createOrder } from '@/features/orders/server/create-order.use-case'
import { decideOrder } from '@/features/orders/server/decide-order.use-case'

let buyer: Headers
let approver: Headers
let outsider: Headers

async function login(name: string) {
  const response = await auth.api.signInEmail({
    body: { email: `${name}@example.test`, password: 'Demo-password-123!' },
    asResponse: true,
  })

  return new Headers({
    cookie: response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; '),
  })
}

beforeAll(async () => {
  buyer = await login('alice')
  approver = await login('approver-a')
  outsider = await login('approver-b')
})

afterAll(() => pool.end())

test('approval requires current company membership and the approver role', async () => {
  const created = await createOrder({ items: [{ productId: 'notebook-a', quantity: 1 }] }, buyer)
  await expect(
    decideOrder({ orderId: created.id, decision: 'approved' }, buyer),
  ).rejects.toMatchObject({ status: 403 })
  await expect(
    decideOrder({ orderId: created.id, decision: 'approved' }, outsider),
  ).rejects.toMatchObject({ status: 404 })
  const outcomes = await Promise.allSettled([
    decideOrder({ orderId: created.id, decision: 'approved' }, approver),
    decideOrder({ orderId: created.id, decision: 'rejected' }, approver),
  ])
  expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
})

test('company catalogs and buyer permissions are enforced during checkout', async () => {
  await expect(
    createOrder({ items: [{ productId: 'notebook-b', quantity: 1 }] }, buyer),
  ).rejects.toMatchObject({ status: 400 })
  await expect(
    createOrder({ items: [{ productId: 'notebook-a', quantity: 1 }] }, approver),
  ).rejects.toMatchObject({ status: 403 })
})
