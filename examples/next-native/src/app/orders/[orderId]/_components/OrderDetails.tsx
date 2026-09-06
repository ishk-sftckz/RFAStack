import { Suspense } from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getOrder, getDeliveryEstimate } from '@/features/orders/order.queries'
import { cancelAction } from '@/features/orders/order.actions'
import { Tracking } from '@/features/orders/ui/Tracking'
import { DeliveryEstimate } from '@/features/orders/ui/DeliveryEstimate'
import { canCancel } from '@/features/orders/model/order-cancellation'
import { ActionForm } from '@/shared/ui/ActionForm'
import { formatCurrency } from '@/shared/utils/currency'
import { AccessError } from '@/shared/utils/errors'

import { OrderTotal } from './OrderTotal'

export async function OrderDetails({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const order = await getOrder(orderId).catch((error) => {
    if (error instanceof AccessError && error.status === 404) {
      notFound()
    }

    if (error instanceof AccessError && error.status === 401) {
      redirect('/sign-in')
    }

    throw error
  })
  const estimate = getDeliveryEstimate(await headers())

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
