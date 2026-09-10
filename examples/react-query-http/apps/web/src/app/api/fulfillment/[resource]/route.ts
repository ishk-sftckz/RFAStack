import { revalidateTag } from 'next/cache'
import { listShipments, listCurrentProducts } from '@/features/fulfillment/fulfillment.queries'
import { transitionShipment, updatePrice } from '@/features/fulfillment/fulfillment.use-case'
import { AccessError, failure } from '@/shared/utils/errors'

async function handle(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params
    if (resource !== 'shipments' && resource !== 'products') {
      throw new AccessError(404, 'Endpoint not found.')
    }

    let result: unknown
    if (request.method === 'GET') {
      result = await (resource === 'shipments'
        ? listShipments(request.headers)
        : listCurrentProducts(request.headers))
    } else {
      if (request.headers.get('Origin') !== process.env.BETTER_AUTH_URL) {
        throw new AccessError(403, 'Untrusted request origin.')
      }

      const input = await request.json()
      const changed = await (resource === 'shipments'
        ? transitionShipment(input, request.headers)
        : updatePrice(input, request.headers))
      revalidateTag(changed.tag, { expire: 0 })
      result = changed
    }

    return Response.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const result = failure(error)

    return Response.json(result, { status: result.status })
  }
}

export { handle as GET, handle as POST }
