import { beforeEach, expect, test, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { edenFetch } from '@elysia/eden'

vi.mock('../apps/api/src/features/auth/auth.provider', () => ({
  authProvider: {
    handler: vi.fn(
      async (request: Request) =>
        new Response(await request.text(), {
          headers: { 'Set-Cookie': 'session=example; HttpOnly' },
        }),
    ),
  },
}))
vi.mock('../apps/api/src/features/membership/membership.queries', () => ({
  requireMembership: vi.fn(),
}))
vi.mock('../apps/api/src/features/membership/preferences.use-case', () => ({
  savePreferences: vi.fn(),
}))
vi.mock('../apps/api/src/features/fulfillment/fulfillment.queries', () => ({
  listShipments: vi.fn(),
  listProducts: vi.fn(),
  getWarehouseSummary: vi.fn(),
}))
vi.mock('../apps/api/src/features/fulfillment/fulfillment.use-case', () => ({
  transitionShipment: vi.fn(),
  updatePrice: vi.fn(),
}))
vi.mock('../apps/api/src/features/fulfillment/carrier.use-case', () => ({
  receiveCarrierEvent: vi.fn(),
}))
vi.mock('../apps/api/src/features/fulfillment/deliver-invalidations.use-case', () => ({
  deliverInvalidations: vi.fn(),
}))

import { app, type App } from '../apps/api/src/app'
import {
  listShipments,
  getWarehouseSummary,
} from '../apps/api/src/features/fulfillment/fulfillment.queries'
import { transitionShipment } from '../apps/api/src/features/fulfillment/fulfillment.use-case'
import { receiveCarrierEvent } from '../apps/api/src/features/fulfillment/carrier.use-case'
import { AccessError } from '../apps/api/src/shared/utils/errors'
import { readResult } from '@/platform/http/result'

const origin = 'http://localhost:3102'
const api = edenFetch<App>('http://localhost', {
  fetcher: Object.assign(
    (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
      app.handle(new Request(input, init)),
    { preconnect: fetch.preconnect },
  ),
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('BETTER_AUTH_URL', origin)
  vi.stubEnv('INTEGRATION_SECRET', 'test-integration-secret')
})

test('Eden Fetch reads an Elysia response and forwards the session cookie', async () => {
  const shipments = [
    { id: 'north', warehouseId: 'warehouse-north', customer: 'North', status: 'queued' as const },
  ]
  vi.mocked(listShipments).mockResolvedValue(shipments)
  const result = await api('/fulfillment/shipments', { headers: { cookie: 'session=north' } })
  expect(readResult(result)).toEqual(shipments)
  expect(vi.mocked(listShipments).mock.calls[0][0].get('cookie')).toBe('session=north')
  const response = await app.handle(new Request('http://localhost/fulfillment/shipments'))
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})

test('Eden mutations pass validated bodies and preserve conflict errors', async () => {
  vi.mocked(transitionShipment).mockResolvedValue({ tag: 'warehouse:north' })
  const input = { id: 'north', status: 'packed' as const }
  const result = await api('/fulfillment/shipments', {
    method: 'POST',
    headers: { origin },
    body: input,
  })
  expect(readResult(result)).toEqual({ tag: 'warehouse:north' })
  expect(transitionShipment).toHaveBeenCalledWith(input, expect.any(Headers))
  vi.mocked(transitionShipment).mockRejectedValue(new AccessError(409, 'Already changed.'))
  const conflict = await api('/fulfillment/shipments', {
    method: 'POST',
    headers: { origin },
    body: input,
  })
  expect(conflict.status).toBe(409)
  expect(() => readResult(conflict)).toThrow('Already changed.')
})

test('invalid input and malformed JSON return 400 without running the use case', async () => {
  for (const body of ['{', JSON.stringify({ id: 'north', status: 'delivered' })]) {
    const result = await app.handle(
      new Request('http://localhost/fulfillment/shipments', {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body,
      }),
    )
    expect(result.status).toBe(400)
    expect(await result.json()).toEqual({ status: 400, error: 'Check the submitted values.' })
  }
  expect(transitionShipment).not.toHaveBeenCalled()
})

test('untrusted mutation origins are rejected before the use case', async () => {
  const result = await api('/fulfillment/shipments', {
    method: 'POST',
    headers: { origin: 'https://untrusted.example' },
    body: { id: 'north', status: 'packed' },
  })
  expect(result.status).toBe(403)
  expect(transitionShipment).not.toHaveBeenCalled()
})

test('auth receives an untouched body and its cookie reaches the caller', async () => {
  const body = '{ "email": "north@example.test" }'
  const response = await app.handle(
    new Request('http://localhost/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  )
  expect(await response.text()).toBe(body)
  expect(response.headers.get('set-cookie')).toContain('session=example')
})

test('carrier signatures cover the exact body bytes before JSON parsing', async () => {
  const body = '{ "eventId": "event-1", "shipmentId": "north", "status": "delivered" }'
  const signature = createHmac('sha256', process.env.INTEGRATION_SECRET!).update(body).digest('hex')
  vi.mocked(receiveCarrierEvent).mockResolvedValue({ duplicate: false })
  const send = (payload: string) =>
    app.handle(
      new Request('http://localhost/events/carrier', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-signature': signature },
        body: payload,
      }),
    )
  expect((await send(body)).status).toBe(200)
  expect(receiveCarrierEvent).toHaveBeenCalledWith(JSON.parse(body))
  expect((await send(JSON.stringify(JSON.parse(body)))).status).toBe(401)
  expect(receiveCarrierEvent).toHaveBeenCalledTimes(1)
})

test('summary requires service authentication and unknown endpoints return 404', async () => {
  expect((await app.handle(new Request('http://localhost/internal/summary/north'))).status).toBe(
    401,
  )
  expect(getWarehouseSummary).not.toHaveBeenCalled()
  vi.mocked(getWarehouseSummary).mockResolvedValue({
    warehouseId: 'north',
    total: 1,
    dispatched: 0,
  })
  const result = await api('/internal/summary/:scopeId', {
    params: { scopeId: 'north' },
    headers: { Authorization: `Bearer ${process.env.INTEGRATION_SECRET}` },
  })
  expect(readResult(result).warehouseId).toBe('north')
  expect((await app.handle(new Request('http://localhost/missing'))).status).toBe(404)
})
