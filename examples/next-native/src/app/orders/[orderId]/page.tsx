import Link from 'next/link'
import { Suspense } from 'react'
import { OrderDetails } from './_components/OrderDetails'

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <>
      <Link className="back-link" href="/account">
        ← Back to your account
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Your purchase</p>
        <h1>Order details</h1>
        <p>Review your items and check delivery progress.</p>
      </div>
      <Suspense fallback={<p>Loading order…</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </>
  )
}
