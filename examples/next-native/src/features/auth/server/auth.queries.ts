import 'server-only'
import { AccessError } from '@/shared/utils/errors'
import { authProvider } from './auth.provider'
import { sessionSchema } from '../model/auth.schema'

export async function requireSession(requestHeaders: Headers) {
  const session = await authProvider.api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  })

  if (!session) {
    throw new AccessError(401, 'Please sign in.')
  }

  return sessionSchema.parse({ userId: session.user.id, name: session.user.name })
}
