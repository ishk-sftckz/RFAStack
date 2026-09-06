'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { orders } from '../order.client'
import { orderListOptions } from '../order.query-options'
import type { Identity } from '@/features/identity/model/identity.schema'
import { formatCurrency } from '@/shared/utils/currency'

export function PurchaseOrders({ identity }: { identity: Identity }) {
  const [filter, setFilter] = useState('all')
  const query = useQuery(orderListOptions(identity.scopeId))
  const client = useQueryClient()
  const router = useRouter()
  const decide = useMutation(
    orders.decide.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: orderListOptions(identity.scopeId).queryKey })
        router.refresh()
      },
    }),
  )

  if (query.isPending) {
    return <p>Loading purchase orders…</p>
  }

  if (query.isError) {
    return (
      <>
        <p role="alert">{query.error.message}</p>
        <button onClick={() => query.refetch()}>Try again</button>
      </>
    )
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Purchase orders</h2>
          <p className="hint">
            {identity.role === 'approver'
              ? 'Review the items before making a decision.'
              : 'Follow your requests from submission to decision.'}
          </p>
        </div>
      </div>
      <label htmlFor="order-status">Order status</label>
      <select id="order-status" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">All orders</option>
        <option value="submitted">Awaiting approval</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      {query.data.length === 0 && <p className="empty">No purchase orders yet.</p>}
      {query.data.length > 0 &&
        !query.data.some((order) => filter === 'all' || order.status === filter) && (
          <div className="empty">
            <p>No orders with this status.</p>
            <button className="button-secondary" onClick={() => setFilter('all')}>
              Show all orders
            </button>
          </div>
        )}
      <ul className="record-list">
        {query.data
          .filter((order) => filter === 'all' || order.status === filter)
          .map((order) => (
            <li className="record" key={order.id}>
              <div className="record-top">
                <strong className="record-id">{order.id}</strong>
                <span className="price">{formatCurrency(order.total)}</span>
              </div>
              <div className="record-meta">
                <span className="badge" data-status={order.status}>
                  {order.status}
                </span>
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </div>
              <details className="order-items">
                <summary>
                  View items ({order.items.reduce((total, item) => total + item.quantity, 0)})
                </summary>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}-${index}`}>
                      {item.name} × {item.quantity} · {formatCurrency(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </details>
              {identity.role === 'approver' && order.status === 'submitted' && (
                <div className="actions">
                  <button
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ orderId: order.id, decision: 'approved' })}
                  >
                    <span aria-hidden="true">
                      {decide.isPending &&
                      decide.variables?.orderId === order.id &&
                      decide.variables.decision === 'approved'
                        ? 'Approving…'
                        : 'Approve'}
                    </span>
                    <span className="sr-only">Approve {order.id}</span>
                  </button>
                  <button
                    className="button-danger"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ orderId: order.id, decision: 'rejected' })}
                  >
                    <span aria-hidden="true">
                      {decide.isPending &&
                      decide.variables?.orderId === order.id &&
                      decide.variables.decision === 'rejected'
                        ? 'Rejecting…'
                        : 'Reject'}
                    </span>
                    <span className="sr-only">Reject {order.id}</span>
                  </button>
                </div>
              )}
            </li>
          ))}
      </ul>
      <p role="alert">{decide.error?.message}</p>
      <p role="status">{decide.isSuccess ? 'Decision saved.' : ''}</p>
    </section>
  )
}
