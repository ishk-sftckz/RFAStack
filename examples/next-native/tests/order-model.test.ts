import { expect, test } from 'vitest'
import { orderStatusSchema } from '@/features/orders/model/order.schema'
import { canCancel } from '@/features/orders/model/order-cancellation'

test.each([
  ['pending', true],
  ['shipped', false],
  ['cancelled', false],
] as const)('cancellation eligibility for %s', (status, allowed) => {
  expect(canCancel(orderStatusSchema.parse(status))).toBe(allowed)
})

test('order status rejects an unrelated workflow state', () => {
  expect(orderStatusSchema.safeParse('approved').success).toBe(false)
})

test('order DTOs convert dates and omit account scope and private fields', async () => {
  const { toOrderDto } = await import('@/features/orders/order.dto')
  const row = {
    id: 'order-test',
    scopeId: 'private-scope',
    status: 'pending',
    total: 1200,
    items: [{ productId: 'notebook', name: 'Notebook', price: 1200, quantity: 1 }],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    privateNote: 'must not leave the server',
  }
  expect(toOrderDto(row)).toEqual({
    id: row.id,
    status: row.status,
    total: row.total,
    items: row.items,
    createdAt: '2026-01-01T00:00:00.000Z',
  })
  expect(() => toOrderDto({ ...row, status: 'invalid' })).toThrow()
})
