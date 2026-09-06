import { createHmac } from 'node:crypto'

const shipmentId = process.argv[2] ?? 'shipment-north'

const body = JSON.stringify({
  eventId: process.argv[3] ?? crypto.randomUUID(),
  shipmentId,
  status: 'delivered',
})

const response = await fetch(`${process.env.BACKEND_URL}/events/carrier`, {
  method: 'POST',
  body,
  headers: {
    'X-Signature': createHmac('sha256', process.env.INTEGRATION_SECRET!).update(body).digest('hex'),
  },
})

console.info(response.status, await response.text())

if (!response.ok) {
  process.exitCode = 1
}
