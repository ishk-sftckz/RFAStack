import { request } from '@/platform/http/client'
import { shipmentSchema, productSchema } from './model/fulfillment.schema'
import type { TransitionInput, PriceInput } from './model/fulfillment.schema'

export async function fetchShipments() {
  return shipmentSchema.array().parse(await request('/api/fulfillment/shipments'))
}

export async function fetchProducts() {
  return productSchema.array().parse(await request('/api/fulfillment/products'))
}

export async function transitionShipment(input: TransitionInput) {
  await request('/api/fulfillment/shipments', input)
}

export async function updatePrice(input: PriceInput) {
  await request('/api/fulfillment/products', input)
}
