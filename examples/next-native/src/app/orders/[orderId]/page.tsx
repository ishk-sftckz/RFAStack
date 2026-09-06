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
      <h2>{order.id}</h2>
      <OrderTotal id={order.id} />
      <ul>
        {order.items.map((item, index) => (
          <li key={index}>
            {item.name} × {item.quantity} · {formatCurrency(item.price)}
          </li>
        ))}
      </ul>
      <Tracking status={order.status} />
      {canCancel(order.status) && (
        <ActionForm action={cancelAction} label="Cancel order">
          <input type="hidden" name="orderId" value={order.id} />
        </ActionForm>
      )}
      <Suspense fallback={<p>Checking delivery estimate…</p>}>
        <DeliveryEstimate estimate={estimate} />
      </Suspense>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <>
      <h1>Order details</h1>
      <Suspense fallback={<p>Loading order…</p>}>
        <Details params={params} />
      </Suspense>
    </>
  )
}
