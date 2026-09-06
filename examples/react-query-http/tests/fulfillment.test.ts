import { beforeAll, afterAll, expect, test } from 'vitest'
import { auth } from '../backend/features/identity/server/auth'
import { pool, database } from '../backend/platform/database/client'
import { shipment } from '../backend/features/fulfillment/server/fulfillment.table'
import {
  transitionShipment,
  updatePrice,
} from '../backend/features/fulfillment/server/fulfillment.use-case'
import { receiveCarrierEvent } from '../backend/features/fulfillment/server/carrier.use-case'

let north: Headers
let south: Headers

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
  north = await login('north')
  south = await login('south')
})

afterAll(() => pool.end())

test('conditional transitions prevent duplicate dispatch and cross-warehouse writes', async () => {
  const id = crypto.randomUUID()
  await database
    .insert(shipment)
    .values({ id, warehouseId: 'warehouse-north', customer: 'Test', status: 'packed' })
  await expect(transitionShipment({ id, status: 'dispatched' }, south)).rejects.toMatchObject({
    status: 404,
  })
  const results = await Promise.allSettled([
    transitionShipment({ id, status: 'dispatched' }, north),
    transitionShipment({ id, status: 'dispatched' }, north),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  const input = { eventId: crypto.randomUUID(), shipmentId: id, status: 'delivered' }
  expect(await receiveCarrierEvent(input)).toEqual({ duplicate: false })
  expect(await receiveCarrierEvent(input)).toEqual({ duplicate: true })
})

test('operators cannot change prices', async () => {
  await expect(updatePrice({ id: 'notebook', price: 1 }, north)).rejects.toMatchObject({
    status: 403,
  })
})
