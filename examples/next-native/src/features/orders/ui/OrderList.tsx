import Link from 'next/link'
import { formatCurrency } from '@/shared/utils/currency'
import { Icon } from '@/shared/ui/Icon'
import type { Order } from '../model/order.schema'

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Your orders</h2>
          <p className="hint">Open an order for items and delivery details.</p>
        </div>
        <span className="badge">{orders.length}</span>
      </div>
      {orders.length ? (
        <ul className="record-list">
          {orders.map((order) => (
            <li className="record" key={order.id}>
              <div className="record-top">
                <Link className="record-id" href={`/orders/${order.id}`}>
                  {order.id}
                </Link>
                <span className="price">{formatCurrency(order.total)}</span>
              </div>
              <div className="record-meta">
                <span className="badge" data-status={order.status}>
                  {order.status}
                </span>
                <span>Items: {order.items.reduce((total, item) => total + item.quantity, 0)}</span>
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <span className="product-icon">
            <Icon />
          </span>
          <p>No orders yet.</p>
          <small>Choose quantities in New order to get started.</small>
        </div>
      )}
    </section>
  )
}
