import { shipmentSchema, productSchema } from './model/fulfillment.schema'

async function request(path: string, input?: unknown) {
  const response = await fetch(`/api/fulfillment/${path}`, {
    method: input ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(input ? { body: JSON.stringify(input) } : {}),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error ?? 'Request failed.')
  }

  return result
}

export async function fetchShipments() {
  return shipmentSchema.array().parse(await request('shipments'))
}

export async function fetchProducts() {
  return productSchema.array().parse(await request('products'))
}

export const transitionShipment = (input: { id: string; status: 'packed' | 'dispatched' }) =>
  request('shipments', input)

export const updatePrice = (input: { id: string; price: number }) => request('products', input)

export const updatePreferences = (input: { preference: string; savedFilter: string }) =>
  request('preferences', input)
