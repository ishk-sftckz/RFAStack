import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireMembership } from '@/features/membership/membership.queries'
import { SignOut } from '@/features/auth/ui/SignOut'
import { Preferences } from '@/features/membership/ui/Preferences'
import { listProducts } from '@/features/catalog/catalog.queries'
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'
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
  const [products, orders] = await Promise.all([listProducts(), listOrders(requestHeaders)])

  return (
    <>
      <div className="membership-bar">
        <div className="membership-info">
          <span className="avatar" aria-hidden="true">
            {membership.name.slice(0, 1)}
          </span>
          <div>
            <p>Signed in as {membership.name}</p>
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
        <CheckoutForm products={products} />
        <OrderList orders={orders} />
      </div>
      <div className="grid">
        <Preferences preference={membership.preference} />
        <Suspense fallback={<p>Loading recommendations…</p>}>
          <Recommendations />
        </Suspense>
      </div>
    </>
  )
}
