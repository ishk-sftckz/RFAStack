'use client'

import { use } from 'react'

export function DeliveryEstimate({ estimate }: { estimate: Promise<{ days: number }> }) {
  const value = use(estimate)

  return <p>Estimated delivery: {value.days} business days.</p>
}
