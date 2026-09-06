'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { catalogOptions } from '@/features/catalog/catalog.query-options'
import type { Product } from '@/features/catalog/model/catalog.schema'
import { orders } from '@/features/orders/order.client'
import { orderListOptions } from '@/features/orders/order.query-options'
import { QuantityInput } from '@/shared/ui/QuantityInput'
import { Icon } from '@/shared/ui/Icon'
import { formatCurrency } from '@/shared/utils/currency'

const Draft = createContext<{
  quantities: Record<string, number>
  set: (id: string, quantity: number) => void
  reset: () => void
} | null>(null)

function useDraft() {
  const value = useContext(Draft)

  if (!value) {
    throw new Error('Missing purchase draft')
  }

  return value
}

function Provider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  return (
    <Draft
      value={{
        quantities,
        reset: () => setQuantities({}),
        set: (id, quantity) => setQuantities((old) => ({ ...old, [id]: quantity })),
      }}
    >
      {children}
    </Draft>
  )
}

function Item({ product }: { product: Product }) {
  const draft = useDraft()

  return (
    <div className="product-row">
      <span className="product-icon">
        <Icon name="bag" />
      </span>
      <div className="product-info">
        <strong>{product.name}</strong>
        <small>{formatCurrency(product.price)} / item</small>
      </div>
      <QuantityInput
        name={product.name}
        value={draft.quantities[product.id] ?? 0}
        onChange={(quantity) => draft.set(product.id, quantity)}
      />
    </div>
  )
}

function Submit({ scopeId, products }: { scopeId: string; products: Product[] }) {
  const draft = useDraft()
  const client = useQueryClient()
  const router = useRouter()
  const mutation = useMutation(
    orders.submit.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: orderListOptions(scopeId).queryKey })
        draft.reset()
        router.refresh()
      },
    }),
  )

  return (
    <>
      <div className="draft-summary">
        <p className="total-line">
          Draft total:{' '}
          <strong className="price">
            {formatCurrency(
              products.reduce(
                (total, product) => total + product.price * (draft.quantities[product.id] ?? 0),
                0,
              ),
            )}
          </strong>
        </p>
        <p className="hint">Your company approver will review this request.</p>
        <button
          disabled={
            mutation.isPending ||
            !products.some((product) => (draft.quantities[product.id] ?? 0) > 0)
          }
          onClick={() =>
            mutation.mutate({
              items: products
                .filter((p) => draft.quantities[p.id] > 0)
                .map((p) => ({ productId: p.id, quantity: draft.quantities[p.id] })),
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
    </>
  )
}

export function PurchaseDraft({ scopeId }: { scopeId: string }) {
  const query = useQuery(catalogOptions(scopeId))

  if (query.isPending) {
    return <p>Loading company catalog…</p>
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
          <h2>New purchase order</h2>
          <p className="hint">Choose quantities to build your request.</p>
        </div>
        <span className="product-icon">
          <Icon name="bag" />
        </span>
      </div>
      <Provider>
        {query.data.map((product) => (
          <Item product={product} key={product.id} />
        ))}
        <Submit scopeId={scopeId} products={query.data} />
      </Provider>
    </section>
  )
}
