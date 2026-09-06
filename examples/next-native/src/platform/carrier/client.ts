import 'server-only'
import { z } from 'zod'

export async function fetchDeliveryEstimate() {
  const response = await fetch(process.env.CARRIER_URL ?? 'http://127.0.0.1:4101/estimate', {
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    throw new Error('Carrier unavailable')
  }

  return z.object({ days: z.number().int().positive() }).parse(await response.json())
}
