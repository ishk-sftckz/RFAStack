'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Product } from '@/features/catalog/model/catalog.schema'
import { QuantityInput } from '@/shared/ui/QuantityInput'
import { Icon } from '@/shared/ui/Icon'
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
        onChange={(quantity) => draft.setQuantity(product.id, quantity)}
      />
    </div>
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
      <div className="draft-summary">
        <p className="total-line">
          Estimated total: <strong className="price">{formatCurrency(total)}</strong>
        </p>
        <p className="hint">Demo purchase. No payment is taken.</p>
        <ActionForm action={checkoutAction} label="Place order" disabled={items.length === 0}>
          <input type="hidden" name="items" value={JSON.stringify({ items })} />
        </ActionForm>
      </div>
    </>
  )
}

export function OrderDraft({ products }: { products: Product[] }) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>New order</h2>
          <p className="hint">Choose up to 20 of each item.</p>
        </div>
        <span className="product-icon">
          <Icon name="bag" />
        </span>
      </div>
      <DraftProvider>
        {products.map((product) => (
          <DraftItem key={product.id} product={product} />
        ))}
        <DraftSummary products={products} />
      </DraftProvider>
    </section>
  )
}
