import 'server-only'
import { backend } from '@/platform/http/backend'
import { identitySchema } from '../model/identity.schema'

export async function requireIdentity(requestHeaders: Headers) {
  return identitySchema.parse(await backend('/identity', requestHeaders))
}
