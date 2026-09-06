import { expect, test } from 'vitest'
import { orderStatusSchema } from '@/features/orders/model/order.schema'

test.each(['submitted', 'approved', 'rejected'])('purchase orders accept %s', (status) => {
  expect(orderStatusSchema.parse(status)).toBe(status)
})

test('purchase orders reject a customer-portal workflow state', () => {
  expect(orderStatusSchema.safeParse('pending').success).toBe(false)
})

test('order DTOs convert dates and omit account scope and private fields', async () => {
  const { toOrderDto } = await import('@/features/orders/server/order.dto')
  const row = {
    id: 'order-test',
    scopeId: 'private-scope',
    status: 'submitted',
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
