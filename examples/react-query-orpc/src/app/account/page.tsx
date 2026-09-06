import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { SignOut } from '@/features/identity/ui/SignIn'
import { Preferences } from '@/features/identity/ui/Preferences'
import { listOrders } from '@/features/orders/server/order.queries'
import { orderListOptions } from '@/features/orders/order.query-options'
import { PurchaseOrders } from '@/features/orders/ui/PurchaseOrders'
import { listProducts, getRecommendations } from '@/features/catalog/server/catalog.queries'
import { catalogOptions } from '@/features/catalog/catalog.query-options'
import { PurchaseDraft } from '@/features/checkout/ui/PurchaseDraft'
import { AccessError } from '@/shared/utils/errors'

async function Recommendations() {
  const data = await getRecommendations()

  return (
    <section>
      <h2>Suggested reorders</h2>
      <p>Delivery: {data.preference}</p>
      <ul>
        {data.products.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </section>
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
  const [products, orders] = await Promise.all([
    listProducts(requestHeaders),
    listOrders(requestHeaders),
  ])
  const client = new QueryClient()
  client.setQueryData(orderListOptions(identity.scopeId).queryKey, orders)
  client.setQueryData(catalogOptions(identity.scopeId).queryKey, products)

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
              Company: {identity.scopeId} · Role: {identity.role}
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
        <div className={identity.role === 'buyer' ? 'grid' : undefined}>
          {identity.role === 'buyer' && <PurchaseDraft scopeId={identity.scopeId} />}
          <PurchaseOrders identity={identity} />
        </div>
      </HydrationBoundary>
      <div className="grid">
        <section>
          <h2>Delivery preferences</h2>
          <Preferences preference={identity.preference} />
        </section>
        <Suspense fallback={<p>Loading suggestions…</p>}>
          <Recommendations />
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
        <h1>Company workspace</h1>
        <p>Manage purchase requests and company orders.</p>
      </div>
      <Suspense fallback={<p>Loading workspace…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
