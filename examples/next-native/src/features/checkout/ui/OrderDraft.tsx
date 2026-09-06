'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Product } from '@/features/catalog/model/catalog.schema'
import { formatCurrency } from '@/shared/utils/currency'
import { ActionForm } from '@/shared/ui/ActionForm'
import { checkoutAction } from '../server/checkout.actions'

const DraftContext = createContext<{
  quantities: Record<string, number>
  setQuantity: (id: string, quantity: number) => void
} | null>(null)

function useDraft() {
  const value = useContext(DraftContext)

  if (!value) {
    throw new Error('Order draft provider is missing')
  }

  return value
}

function DraftProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  return (
    <DraftContext
      value={{
        quantities,
        setQuantity: (id, quantity) =>
          setQuantities((previous) => ({ ...previous, [id]: quantity })),
      }}
    >
      {children}
    </DraftContext>
  )
}

function DraftItem({ product }: { product: Product }) {
  const draft = useDraft()

  return (
    <label>
      {product.name} · {formatCurrency(product.price)}
      <input
        aria-label={`${product.name} quantity`}
        type="number"
        min="0"
        max="20"
        value={draft.quantities[product.id] ?? 0}
        onChange={(event) => draft.setQuantity(product.id, Number(event.target.value))}
      />
    </label>
  )
}

function DraftSummary({ products }: { products: Product[] }) {
  const { quantities } = useDraft()
  const items = products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({ productId: product.id, quantity: quantities[product.id] }))
  const total = products.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 0),
    0,
  )

  return (
    <>
      <p>Estimated total: {formatCurrency(total)}</p>
      <ActionForm action={checkoutAction} label="Place order">
        <input type="hidden" name="items" value={JSON.stringify({ items })} />
      </ActionForm>
    </>
  )
}

export function OrderDraft({ products }: { products: Product[] }) {
  return (
    <section>
      <h2>New order</h2>
      <DraftProvider>
        {products.map((product) => (
          <DraftItem key={product.id} product={product} />
        ))}
        <DraftSummary products={products} />
      </DraftProvider>
    </section>
  )
}
