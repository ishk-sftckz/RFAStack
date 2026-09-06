import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireMembership } from '@/features/membership/membership.queries'
import { SignOut } from '@/features/auth/ui/SignOut'
import { Preferences } from '@/features/membership/ui/Preferences'
import { listOrders } from '@/features/orders/order.queries'
import { orderListOptions } from '@/features/orders/order.query-options'
import { PurchaseOrders } from '@/features/orders/ui/PurchaseOrders'
import { listProducts } from '@/features/catalog/catalog.queries'
import { catalogOptions } from '@/features/catalog/catalog.query-options'
import { CheckoutForm } from '@/features/checkout/ui/CheckoutForm/CheckoutForm'
import { AccessError } from '@/shared/utils/errors'

import { Recommendations } from '@/features/catalog/ui/Recommendations'

export async function AccountContent() {
  const requestHeaders = await headers()
  const membership = await requireMembership(requestHeaders).catch((error) => {
    if (error instanceof AccessError && error.status === 401) {
      redirect('/sign-in')
    }

    throw error
  })
  const [products, orders] = await Promise.all([
    listProducts(requestHeaders),
    listOrders(requestHeaders),
  ])
  const client = new QueryClient()
  client.setQueryData(orderListOptions(membership.scopeId).queryKey, orders)
  client.setQueryData(catalogOptions(membership.scopeId).queryKey, products)

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
              Company: {membership.scopeId} · Role: {membership.role}
            </p>
          </div>
        </div>
        <div>
          <SignOut />
        </div>
      </div>
      <div className="stats" aria-label="Purchase overview">
        <div className="stat">
          <span>Purchase orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="stat accent">
          <span>Awaiting approval</span>
          <strong>{orders.filter((order) => order.status === 'submitted').length}</strong>
        </div>
        <div className="stat">
          <span>Approved orders</span>
          <strong>{orders.filter((order) => order.status === 'approved').length}</strong>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(client)}>
        <div className={membership.role === 'buyer' ? 'grid' : undefined}>
          {membership.role === 'buyer' && <CheckoutForm scopeId={membership.scopeId} />}
          <PurchaseOrders membership={membership} />
        </div>
      </HydrationBoundary>
      <div className="grid">
        <section>
          <h2>Delivery preferences</h2>
          <Preferences preference={membership.preference} />
        </section>
        <Suspense fallback={<p>Loading suggestions…</p>}>
          <Recommendations />
        </Suspense>
      </div>
    </>
  )
}
