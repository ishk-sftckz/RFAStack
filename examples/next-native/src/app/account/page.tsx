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
      <div className="identity-bar">
        <div className="identity-info">
          <span className="avatar" aria-hidden="true">
            {identity.name.slice(0, 1)}
          </span>
          <div>
            <p>Signed in as {identity.name}</p>
          </div>
        </div>
        <div>
          <SignOut />
        </div>
      </div>
      <div className="stats" aria-label="Order overview">
        <div className="stat">
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="stat accent">
          <span>Pending orders</span>
          <strong>{orders.filter((order) => order.status === 'pending').length}</strong>
        </div>
        <div className="stat">
          <span>Shipped orders</span>
          <strong>{orders.filter((order) => order.status === 'shipped').length}</strong>
        </div>
      </div>
      <div className="grid">
        <OrderDraft products={products} />
        <OrderList orders={orders} />
      </div>
      <div className="grid">
        <Preferences preference={identity.preference} />
        <Suspense fallback={<p>Loading recommendations…</p>}>
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
        <h1>My account</h1>
        <p>Order supplies and follow your deliveries.</p>
      </div>
      <Suspense fallback={<p>Loading account…</p>}>
        <Account />
      </Suspense>
    </>
  )
}
