'use client'

import { use, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function DeliveryEstimate({ estimate }: { estimate: Promise<{ days: number }> }) {
  const value = use(estimate)

  return <p>Estimated delivery: {value.days} business days.</p>
}

export function Tracking({ status }: { status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <section>
      <h2>Tracking</h2>
      <p role="status" className="badge" data-status={status}>
        {status}
      </p>
      <p className="hint">Refresh to check for the latest delivery status.</p>
      <button disabled={pending} onClick={() => startTransition(() => router.refresh())}>
        {pending ? 'Refreshing…' : 'Refresh tracking'}
      </button>
    </section>
  )
}
