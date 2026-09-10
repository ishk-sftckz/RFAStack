import { api } from '@/platform/http/client'
import { readResult } from '@/platform/http/result'
import { shipmentSchema, productSchema } from './model/fulfillment.schema'
import type { TransitionInput, PriceInput } from './model/fulfillment.schema'

export async function fetchShipments(signal?: AbortSignal) {
  const result = await api('/fulfillment/shipments', { method: 'GET', signal })
  return shipmentSchema.array().parse(readResult(result))
}

export async function fetchProducts(signal?: AbortSignal) {
  const result = await api('/fulfillment/products', { method: 'GET', signal })
  return productSchema.array().parse(readResult(result))
}

export async function transitionShipment(input: TransitionInput) {
  return readResult(await api('/fulfillment/shipments', { method: 'POST', body: input }))
}

export async function updatePrice(input: PriceInput) {
  return readResult(await api('/fulfillment/products', { method: 'POST', body: input }))
}
