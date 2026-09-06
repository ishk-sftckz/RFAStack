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
      <p>Signed in as {identity.name}</p>
      <p>
        Company: {identity.scopeId} · Role: {identity.role}
      </p>
      <SignOut />
      <HydrationBoundary state={dehydrate(client)}>
        {identity.role === 'buyer' && <PurchaseDraft scopeId={identity.scopeId} />}
        <PurchaseOrders identity={identity} />
      </HydrationBoundary>
      <Preferences preference={identity.preference} />
      <Suspense fallback={<p>Loading suggestions…</p>}>
        <Recommendations />
      </Suspense>
    </>
  )
}

export default function Page() {
  return (
    <>
      <h1>Company workspace</h1>
      <Suspense fallback={<p>Loading workspace…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
