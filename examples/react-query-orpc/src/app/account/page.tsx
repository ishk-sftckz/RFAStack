import { Suspense } from 'react'
import { AccountContent } from './_components/AccountContent'

export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your workspace</p>
        <h1>Company workspace</h1>
        <p>Manage purchase requests and company orders.</p>
      </div>
      <Suspense fallback={<p>Loading workspace…</p>}>
        <AccountContent />
      </Suspense>
    </>
  )
}
