import type { App } from '@rfastack/http-api'
import { edenFetch } from '@elysia/eden'
import type { Shipment } from '@rfastack/http-contracts/fulfillment'

// Compiled by typecheck, never executed. These checks fail if the route type becomes any.
export async function checkApiTypes() {
  const api = edenFetch<App>('http://localhost:4102')
  const result = await api('/fulfillment/shipments', { method: 'GET' })
  if (!result.error) {
    const shipments: Shipment[] = result.data
    void shipments
    // @ts-expect-error Shipment lists are not strings.
    const invalid: string = result.data
    void invalid
  }
  // @ts-expect-error Unknown route.
  await api('/does-not-exist', { method: 'GET' })
  // @ts-expect-error Unsupported HTTP method.
  await api('/fulfillment/shipments', { method: 'DELETE' })
  await api('/fulfillment/shipments', {
    method: 'POST',
    // @ts-expect-error Operators cannot submit delivered as a transition.
    body: { id: 'north', status: 'delivered' },
  })
  // @ts-expect-error Prices must be numbers.
  await api('/fulfillment/products', { method: 'POST', body: { id: 'notebook', price: '100' } })
}
