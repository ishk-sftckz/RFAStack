'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { catalogOptions } from '@/features/catalog/catalog.query-options'
import type { Product } from '@/features/catalog/model/catalog.schema'
import { orders } from '@/features/orders/order.client'
import { orderListOptions } from '@/features/orders/order.query-options'
import { formatCurrency } from '@/shared/utils/currency'

const Draft = createContext<{
  quantities: Record<string, number>
  set: (id: string, quantity: number) => void
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
    <label>
      {product.name} · {formatCurrency(product.price)}
      <input
        type="number"
        min="0"
        max="20"
        aria-label={`${product.name} quantity`}
        value={draft.quantities[product.id] ?? 0}
        onChange={(e) => draft.set(product.id, Number(e.target.value))}
      />
    </label>
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
        router.refresh()
      },
    }),
  )

  return (
    <>
      <p>
        Draft total:{' '}
        {formatCurrency(
          products.reduce(
            (total, product) => total + product.price * (draft.quantities[product.id] ?? 0),
            0,
          ),
        )}
      </p>
      <button
        disabled={mutation.isPending}
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
      <h2>New purchase order</h2>
      <Provider>
        {query.data.map((product) => (
          <Item product={product} key={product.id} />
        ))}
        <Submit scopeId={scopeId} products={query.data} />
      </Provider>
    </section>
  )
}
