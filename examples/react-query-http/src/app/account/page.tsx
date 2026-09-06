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
      <p>Signed in as {identity.name}</p>
      <p>Warehouse: {identity.scopeId}</p>
      <SignOut />
      <p>
        Summary: {summary.total} shipments; {summary.dispatched} dispatched.
      </p>
      <Suspense fallback={<p>Loading preferences…</p>}>
        <Preferences />
      </Suspense>
      <HydrationBoundary state={dehydrate(client)}>
        <Dashboard identity={identity} />
      </HydrationBoundary>
    </>
  )
}

export default function Page() {
  return (
    <>
      <h1>Warehouse operations</h1>
      <Suspense fallback={<p>Loading dashboard…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
