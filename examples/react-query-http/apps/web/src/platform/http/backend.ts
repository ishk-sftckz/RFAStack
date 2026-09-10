import 'server-only'
import { edenFetch } from '@elysia/eden'
import type { App } from '@rfastack/http-api'

export function backend(requestHeaders = new Headers()) {
  return edenFetch<App>(process.env.BACKEND_URL!, {
    fetcher: Object.assign(
      (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        const headers = new Headers(init?.headers)
        headers.set('cookie', requestHeaders.get('cookie') ?? '')
        headers.set('origin', process.env.BETTER_AUTH_URL!)
        return fetch(input, {
          ...init,
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })
      },
      { preconnect: fetch.preconnect },
    ),
  })
}
