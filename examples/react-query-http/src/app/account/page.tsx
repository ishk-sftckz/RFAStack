import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { SignOut } from '@/features/identity/ui/SignIn'
import {
  listShipments,
  listProducts,
  getSummary,
  getOperatorPreferences,
} from '@/features/fulfillment/server/fulfillment.queries'
import { shipmentsOptions, productsOptions } from '@/features/fulfillment/fulfillment.query-options'
import { Dashboard } from '@/features/fulfillment/ui/Dashboard'
import { AccessError } from '@/shared/utils/errors'

async function Preferences() {
  const saved = await getOperatorPreferences()

  return (
    <>
      <p>Saved delivery preference: {saved.preference}</p>
      <p>Default queue filter: {saved.savedFilter}</p>
    </>
  )
}

async function Account() {
  const requestHeaders = await headers()
  const identity = await requireIdentity(requestHeaders).catch((error) => {
    if (error instanceof AccessError && error.status === 401) {
      redirect('/sign-in')
    }

    throw error
  })
  const [shipments, products, summary] = await Promise.all([
    listShipments(requestHeaders),
    listProducts(),
    getSummary(requestHeaders),
  ])
  const client = new QueryClient()
  client.setQueryData(shipmentsOptions(identity.scopeId).queryKey, shipments)
  client.setQueryData(productsOptions().queryKey, products)

  return (
    <>
      <div className="identity-bar">
        <div className="identity-info">
          <span className="avatar" aria-hidden="true">
            {identity.name.slice(0, 1)}
          </span>
          <div>
            <p>Signed in as {identity.name}</p>
            <p className="hint">
              Warehouse: {identity.scopeId} · {identity.role}
            </p>
          </div>
        </div>
        <div>
          <SignOut />
        </div>
      </div>
      <p className="hint">
        Summary: {summary.total} shipments; {summary.dispatched} dispatched.
      </p>
      <HydrationBoundary state={dehydrate(client)}>
        <Dashboard identity={identity} />
      </HydrationBoundary>
      <div className="hint">
        <Suspense fallback={<p>Loading preferences…</p>}>
          <Preferences />
        </Suspense>
      </div>
    </>
  )
}

export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your workspace</p>
        <h1>Warehouse operations</h1>
        <p>Pack, dispatch, and follow shipments for your warehouse.</p>
      </div>
      <Suspense fallback={<p>Loading dashboard…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
