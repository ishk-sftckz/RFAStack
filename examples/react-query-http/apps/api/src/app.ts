import { Elysia } from 'elysia'
import { transitionSchema, priceSchema } from '@rfastack/http-contracts/fulfillment'
import { preferenceSchema } from '@rfastack/http-contracts/membership'
import { authProvider } from './features/auth/auth.provider'
import { requireMembership } from './features/membership/membership.queries'
import { savePreferences } from './features/membership/preferences.use-case'
import {
  listShipments,
  listProducts,
  getWarehouseSummary,
} from './features/fulfillment/fulfillment.queries'
import { transitionShipment, updatePrice } from './features/fulfillment/fulfillment.use-case'
import { receiveCarrierEvent } from './features/fulfillment/carrier.use-case'
import { deliverInvalidations } from './features/fulfillment/deliver-invalidations.use-case'
import { validSignature } from './platform/integration/signature'
import { failure, AccessError } from './shared/utils/errors'

export const app = new Elysia()
  .onRequest(({ request, set }) => {
    set.headers['Cache-Control'] = 'private, no-store'
    const path = new URL(request.url).pathname
    const ownsAuthentication =
      path.startsWith('/api/auth/') || path === '/events/carrier' || path.startsWith('/internal/')

    if (
      !ownsAuthentication &&
      request.method !== 'GET' &&
      request.headers.get('Origin') !== process.env.BETTER_AUTH_URL
    ) {
      throw new AccessError(403, 'Untrusted request origin.')
    }
  })
  .onError(({ code, error, status }) => {
    const result: ReturnType<typeof failure> =
      code === 'VALIDATION' || code === 'PARSE'
        ? { status: 400, error: 'Check the submitted values.' }
        : code === 'NOT_FOUND'
          ? { status: 404, error: 'Endpoint not found.' }
          : failure(error)
    return status(result.status, result)
  })
  .all('/api/auth/*', ({ request }) => authProvider.handler(request), { parse: 'none' })
  .get('/health', () => ({ ok: true }))
  .post(
    '/events/carrier',
    async ({ request }) => {
      // Verify the original bytes before parsing the signed event.
      const raw = await request.text()
      if (!validSignature(raw, request.headers.get('X-Signature'))) {
        throw new AccessError(401, 'Invalid event signature.')
      }
      const result = await receiveCarrierEvent(JSON.parse(raw))
      void deliverInvalidations()
      return result
    },
    { parse: 'none' },
  )
  .get('/internal/summary/:scopeId', ({ request, params }) => {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.INTEGRATION_SECRET}`) {
      throw new AccessError(401, 'Integration authentication required.')
    }
    return getWarehouseSummary(params.scopeId)
  })
  .get('/membership', ({ request }) => requireMembership(request.headers))
  .get('/fulfillment/shipments', ({ request }) => listShipments(request.headers))
  .get('/fulfillment/products', () => listProducts())
  .post(
    '/fulfillment/shipments',
    ({ body, request }) => transitionShipment(body, request.headers),
    {
      body: transitionSchema,
    },
  )
  .post('/fulfillment/products', ({ body, request }) => updatePrice(body, request.headers), {
    body: priceSchema,
  })
  .post(
    '/membership/preferences',
    async ({ body, request }) => {
      const membership = await savePreferences(body, request.headers)
      return { tag: `preferences:${membership.userId}` }
    },
    { body: preferenceSchema },
  )

export type App = typeof app
