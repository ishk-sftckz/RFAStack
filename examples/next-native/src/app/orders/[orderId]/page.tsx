import Link from 'next/link'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getOrderForRender } from '@/features/orders/server/order.queries'
import { cancelAction } from '@/features/orders/server/order.actions'
import { estimateDelivery } from '@/features/orders/server/delivery.queries'
import { DeliveryEstimate, Tracking } from '@/features/orders/ui/Tracking'
import { canCancel } from '@/features/orders/model/order.schema'
import { ActionForm } from '@/shared/ui/ActionForm'
import { formatCurrency } from '@/shared/utils/currency'
import { AccessError } from '@/shared/utils/errors'

async function OrderTotal({ id }: { id: string }) {
  const order = await getOrderForRender(id)

  return <p>Total: {formatCurrency(order.total)}</p>
}

async function Details({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const order = await getOrderForRender(orderId).catch((error) => {
    if (error instanceof AccessError && error.status === 404) {
      notFound()
    }

    if (error instanceof AccessError && error.status === 401) {
      redirect('/sign-in')
    }

    throw error
  })
  const estimate = estimateDelivery(await headers())

  return (
    <>
      <section>
        <div className="section-heading">
          <h2 className="record-id">{order.id}</h2>
          <span className="badge" data-status={order.status}>
            {order.status}
          </span>
        </div>
        <OrderTotal id={order.id} />
        <ul className="record-list">
          {order.items.map((item, index) => (
            <li className="record" key={index}>
              {item.name} × {item.quantity} · {formatCurrency(item.price)}
            </li>
          ))}
        </ul>
      </section>
      <div className="grid">
        <Tracking status={order.status} />
        <section>
          <h2>Manage delivery</h2>
          <p className="hint">Pending orders can be cancelled before they ship.</p>
          {canCancel(order.status) && (
            <ActionForm action={cancelAction} label="Cancel order" buttonClassName="button-danger">
              <input type="hidden" name="orderId" value={order.id} />
            </ActionForm>
          )}
          <Suspense fallback={<p>Checking delivery estimate…</p>}>
            <DeliveryEstimate estimate={estimate} />
          </Suspense>
        </section>
      </div>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <>
      <Link className="back-link" href="/account">
        ← Back to your account
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Your purchase</p>
        <h1>Order details</h1>
        <p>Review your items and check delivery progress.</p>
      </div>
      <Suspense fallback={<p>Loading order…</p>}>
        <Details params={params} />
      </Suspense>
    </>
  )
}
