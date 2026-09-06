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

Bun.serve({
  port: 4102,
  hostname: '127.0.0.1',
  async fetch(request) {
    const path = new URL(request.url).pathname

    try {
      if (path.startsWith('/api/auth/')) {
        return authProvider.handler(request)
      }

      if (path === '/health') {
        return Response.json({ ok: true })
      }

      if (path === '/events/carrier' && request.method === 'POST') {
        const raw = await request.text()

        if (!validSignature(raw, request.headers.get('X-Signature'))) {
          throw new AccessError(401, 'Invalid event signature.')
        }

        const result = await receiveCarrierEvent(JSON.parse(raw))
        void deliverInvalidations()

        return Response.json(result)
      }

      if (path.startsWith('/internal/summary/') && request.method === 'GET') {
        if (request.headers.get('Authorization') !== `Bearer ${process.env.INTEGRATION_SECRET}`) {
          throw new AccessError(401, 'Integration authentication required.')
        }

        return Response.json(
          await getWarehouseSummary(decodeURIComponent(path.slice('/internal/summary/'.length))),
        )
      }

      if (
        request.method !== 'GET' &&
        request.headers.get('Origin') !== process.env.BETTER_AUTH_URL
      ) {
        throw new AccessError(403, 'Untrusted request origin.')
      }

      let data: unknown

      if (path === '/membership' && request.method === 'GET') {
        data = await requireMembership(request.headers)
      } else if (path === '/shipments' && request.method === 'GET') {
        data = await listShipments(request.headers)
      } else if (path === '/products' && request.method === 'GET') {
        data = await listProducts()
      } else if (path === '/shipments' && request.method === 'POST') {
        data = await transitionShipment(await request.json(), request.headers)
      } else if (path === '/products' && request.method === 'POST') {
        data = await updatePrice(await request.json(), request.headers)
      } else if (path === '/preferences' && request.method === 'POST') {
        const membership = await savePreferences(await request.json(), request.headers)
        data = { tag: `preferences:${membership.userId}` }
      } else {
        throw new AccessError(404, 'Endpoint not found.')
      }

      return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
      const result = failure(error)

      return Response.json(result, { status: result.status })
    }
  },
})

setInterval(() => void deliverInvalidations(), 3000)

console.info('Fulfillment API on 4102')
