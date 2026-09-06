'use client'

import { useState } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { CheckoutItem } from './CheckoutItem'
import { CheckoutSummary } from './CheckoutSummary'
import type { Product } from '@/features/catalog/model/catalog.schema'

export function CheckoutForm({ products }: { products: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

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
      <>
        {products.map((product) => (
          <CheckoutItem
            key={product.id}
            product={product}
            quantity={quantities[product.id] ?? 0}
            onQuantityChange={(quantity) =>
              setQuantities((previous) => ({ ...previous, [product.id]: quantity }))
            }
          />
        ))}
        <CheckoutSummary products={products} quantities={quantities} />
      </>
    </section>
  )
}
