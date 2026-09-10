import 'server-only'
import { readResult } from '@/platform/http/result'
import { backend } from '@/platform/http/backend'
import { requireMembership } from '@/features/membership/membership.queries'
import { transitionSchema, priceSchema } from './model/fulfillment.schema'

export async function transitionShipment(input: unknown, requestHeaders: Headers) {
  await requireMembership(requestHeaders)
  const value = transitionSchema.parse(input)
  return readResult(
    await backend(requestHeaders)('/fulfillment/shipments', { method: 'POST', body: value }),
  )
}

export async function updatePrice(input: unknown, requestHeaders: Headers) {
  await requireMembership(requestHeaders)
  const value = priceSchema.parse(input)
  return readResult(
    await backend(requestHeaders)('/fulfillment/products', { method: 'POST', body: value }),
  )
}
