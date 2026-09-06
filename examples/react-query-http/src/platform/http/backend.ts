import 'server-only'
import { AccessError } from '@/shared/utils/errors'

export async function backend(
  path: string,
  requestHeaders = new Headers(),
  init: RequestInit = {},
) {
  const response = await fetch(`${process.env.BACKEND_URL}${path}`, {
    ...init,
    headers: {
      cookie: requestHeaders.get('cookie') ?? '',
      origin: process.env.BETTER_AUTH_URL!,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new AccessError(response.status as 400, body.error ?? 'Backend request failed.')
  }

  return response.json()
}
