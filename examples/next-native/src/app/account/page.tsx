import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { SignOut } from '@/features/identity/ui/SignIn'
import { Preferences } from '@/features/identity/ui/Preferences'
import { listProducts, getRecommendations } from '@/features/catalog/server/catalog.queries'
import { listOrders } from '@/features/orders/server/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'
import { OrderDraft } from '@/features/checkout/ui/OrderDraft'
import { AccessError } from '@/shared/utils/errors'

async function Recommendations() {
  const result = await getRecommendations()

  return (
    <section>
      <h2>Recommended for you</h2>
      <p>Delivery: {result.preference}</p>
      <ul>
        {result.products.map((product) => (
          <li key={product.id}>{product.name}</li>
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
  const [products, orders] = await Promise.all([listProducts(), listOrders(requestHeaders)])

  return (
    <>
      <p>Signed in as {identity.name}</p>
      <SignOut />
      <div className="grid">
        <OrderDraft products={products} />
        <OrderList orders={orders} />
      </div>
      <Preferences preference={identity.preference} />
      <Suspense fallback={<p>Loading recommendations…</p>}>
        <Recommendations />
      </Suspense>
    </>
  )
}

export default function Page() {
  return (
    <>
      <h1>My account</h1>
      <Suspense fallback={<p>Loading account…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
