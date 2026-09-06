import 'server-only'
import { backend } from '@/platform/http/backend'
import { requireMembership } from '@/features/membership/membership.queries'
import { transitionSchema, priceSchema } from './model/fulfillment.schema'

export async function transitionShipment(input: unknown, requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)
  const value = transitionSchema.parse(input)
  await backend('/shipments', requestHeaders, { method: 'POST', body: JSON.stringify(value) })

  return membership.scopeId
}

export async function updatePrice(input: unknown, requestHeaders: Headers) {
  await requireMembership(requestHeaders)
  const value = priceSchema.parse(input)
  await backend('/products', requestHeaders, { method: 'POST', body: JSON.stringify(value) })
}
