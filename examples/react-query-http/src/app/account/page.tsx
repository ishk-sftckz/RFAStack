import { Suspense } from 'react'
import { AccountContent } from './_components/AccountContent'

export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your workspace</p>
        <h1>Warehouse operations</h1>
        <p>Pack, dispatch, and follow shipments for your warehouse.</p>
      </div>
      <Suspense fallback={<p>Loading dashboard…</p>}>
        <AccountContent />
      </Suspense>
    </>
  )
}
