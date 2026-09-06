'use client'

import { useState } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { CheckoutItem } from './CheckoutItem'
import { CheckoutSummary } from './CheckoutSummary'
import { useQuery } from '@tanstack/react-query'
import { catalogOptions } from '@/features/catalog/catalog.query-options'

export function CheckoutForm({ scopeId }: { scopeId: string }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

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
      <>
        {query.data.map((product) => (
          <CheckoutItem
            key={product.id}
            product={product}
            quantity={quantities[product.id] ?? 0}
            onQuantityChange={(quantity) =>
              setQuantities((previous) => ({ ...previous, [product.id]: quantity }))
            }
          />
        ))}
        <CheckoutSummary
          scopeId={scopeId}
          products={query.data}
          quantities={quantities}
          onSubmitted={() => setQuantities({})}
        />
      </>
    </section>
  )
}
