import 'server-only'
import { fetchDeliveryEstimate } from '@/platform/carrier/client'
import { requireIdentity } from '@/features/identity/server/identity.queries'

export async function estimateDelivery(requestHeaders: Headers) {
  await requireIdentity(requestHeaders)

  return fetchDeliveryEstimate()
}
