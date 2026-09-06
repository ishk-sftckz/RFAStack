import { Suspense } from 'react'
import { AccountContent } from './_components/AccountContent'

export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your workspace</p>
        <h1>My account</h1>
        <p>Order supplies and follow your deliveries.</p>
      </div>
      <Suspense fallback={<p>Loading account…</p>}>
        <AccountContent />
      </Suspense>
    </>
  )
}
