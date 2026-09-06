import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireMembership } from '@/features/membership/server/membership.queries'
import { SignOut } from '@/features/auth/ui/SignOut'
import {
  listShipments,
  listProducts,
  getSummary,
} from '@/features/fulfillment/server/fulfillment.queries'
import { shipmentsOptions, productsOptions } from '@/features/fulfillment/fulfillment.query-options'
import { Dashboard } from '@/features/fulfillment/ui/Dashboard'
import { AccessError } from '@/shared/utils/errors'

import { SavedPreferences } from '@/features/membership/ui/SavedPreferences'

export async function AccountContent() {
  const requestHeaders = await headers()
  const membership = await requireMembership(requestHeaders).catch((error) => {
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
  client.setQueryData(shipmentsOptions(membership.scopeId).queryKey, shipments)
  client.setQueryData(productsOptions().queryKey, products)

  return (
    <>
      <div className="membership-bar">
        <div className="membership-info">
          <span className="avatar" aria-hidden="true">
            {membership.name.slice(0, 1)}
          </span>
          <div>
            <p>Signed in as {membership.name}</p>
            <p className="hint">
              Warehouse: {membership.scopeId} · {membership.role}
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
        <Dashboard membership={membership} />
      </HydrationBoundary>
      <div className="hint">
        <Suspense fallback={<p>Loading preferences…</p>}>
          <SavedPreferences />
        </Suspense>
      </div>
    </>
  )
}
