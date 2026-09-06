'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { orders } from '../order.client'
import { orderListOptions } from '../order.query-options'
import type { Identity } from '@/features/identity/model/identity.schema'
import { formatCurrency } from '@/shared/utils/currency'

export function PurchaseOrders({ identity }: { identity: Identity }) {
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
      <h2>Purchase orders</h2>
      {query.data.length === 0 && <p>No purchase orders yet.</p>}
      <ul>
        {query.data.map((order) => (
          <li key={order.id}>
            <strong>{order.id}</strong> · {formatCurrency(order.total)} ·{' '}
            <span>{order.status}</span>
            {identity.role === 'approver' && order.status === 'submitted' && (
              <>
                <button
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ orderId: order.id, decision: 'approved' })}
                >
                  Approve {order.id}
                </button>
                <button
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ orderId: order.id, decision: 'rejected' })}
                >
                  Reject {order.id}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p role="alert">{decide.error?.message}</p>
      <p role="status">{decide.isSuccess ? 'Decision saved.' : ''}</p>
    </section>
  )
}
