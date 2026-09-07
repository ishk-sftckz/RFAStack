'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Product } from '@/features/catalog/model/catalog.schema'
import { orders } from '@/features/orders/order.rpc-client'
import { orderListOptions } from '@/features/orders/order.query-options'
import { formatCurrency } from '@/shared/utils/currency'

export function CheckoutSummary({
  scopeId,
  products,
  quantities,
  onSubmitted,
}: {
  scopeId: string
  products: Product[]
  quantities: Record<string, number>
  onSubmitted: () => void
}) {
  const client = useQueryClient()
  const router = useRouter()
  const mutation = useMutation(
    orders.submit.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: orderListOptions(scopeId).queryKey })
        onSubmitted()
        router.refresh()
      },
    }),
  )

  return (
    <div className="draft-summary">
      <p className="total-line">
        Draft total:{' '}
        <strong className="price">
          {formatCurrency(
            products.reduce(
              (total, product) => total + product.price * (quantities[product.id] ?? 0),
              0,
            ),
          )}
        </strong>
      </p>
      <p className="hint">Your company approver will review this request.</p>
      <button
        disabled={
          mutation.isPending || !products.some((product) => (quantities[product.id] ?? 0) > 0)
        }
        onClick={() =>
          mutation.mutate({
            items: products
              .filter((p) => quantities[p.id] > 0)
              .map((p) => ({ productId: p.id, quantity: quantities[p.id] })),
          })
        }
      >
        {mutation.isPending ? 'Submitting…' : 'Submit for approval'}
      </button>
      <p role="alert">{mutation.error?.message}</p>
      <p role="status">
        {mutation.isSuccess ? `Purchase order submitted: ${mutation.data.id}` : ''}
      </p>
    </div>
  )
}
