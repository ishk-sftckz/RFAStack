import Link from 'next/link'
import { formatCurrency } from '@/shared/utils/currency'
import type { Order } from '../model/order.schema'

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <section>
      <h2>Your orders</h2>
      {orders.length ? (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`}>{order.id}</Link> · {order.status} ·{' '}
              {formatCurrency(order.total)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders yet.</p>
      )}
    </section>
  )
}
