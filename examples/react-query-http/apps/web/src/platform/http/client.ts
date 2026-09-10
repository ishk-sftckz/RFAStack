import { edenFetch } from '@elysia/eden'
import type { App } from '@rfastack/http-api'

// Next.js forwards these routes and preserves the Elysia response contract.
export const api = edenFetch<App>('/api')
