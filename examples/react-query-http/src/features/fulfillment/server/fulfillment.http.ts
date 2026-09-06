import 'server-only'
import { revalidateTag } from 'next/cache'
import { backend } from '@/platform/http/backend'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { AccessError } from '@/shared/utils/errors'

const paths = new Set(['shipments', 'products', 'preferences'])

export async function handleFulfillment(request: Request, resource: string) {
  if (!paths.has(resource)) {
    throw new AccessError(404, 'Endpoint not found.')
  }

  if (request.method !== 'GET' && request.headers.get('Origin') !== process.env.BETTER_AUTH_URL) {
    throw new AccessError(403, 'Untrusted request origin.')
  }

  await requireIdentity(request.headers)
  const result = await backend(`/${resource}`, request.headers, {
    method: request.method,
    ...(request.method === 'POST' ? { body: await request.text() } : {}),
  })

  if (request.method === 'POST' && typeof result.tag === 'string') {
    revalidateTag(result.tag, { expire: 0 })
  }

  return result
}
