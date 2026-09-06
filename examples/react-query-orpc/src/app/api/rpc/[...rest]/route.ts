import { RPCHandler } from '@orpc/server/fetch'
import { router } from '../router'

const handler = new RPCHandler(router)

async function handle(request: Request) {
  if (request.method !== 'GET' && request.headers.get('Origin') !== process.env.BETTER_AUTH_URL) {
    return Response.json({ error: 'Untrusted request origin.' }, { status: 403 })
  }

  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { headers: request.headers },
  })

  if (response) {
    response.headers.set('Cache-Control', 'private, no-store')
  }

  return response ?? new Response('Not found', { status: 404 })
}

export { handle as GET, handle as POST }
