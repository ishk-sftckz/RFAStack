'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { shipmentsOptions, productsOptions } from '../fulfillment.query-options'
import { transitionShipment, updatePrice, updatePreferences } from '../fulfillment.api'
import type { Identity } from '@/features/identity/model/identity.schema'
import { formatCurrency } from '@/shared/utils/currency'

function QueueCount({ scopeId }: { scopeId: string }) {
  const query = useQuery(shipmentsOptions(scopeId))

  return <p>Queue total: {query.data?.length ?? 0}</p>
}

export function Dashboard({ identity }: { identity: Identity }) {
  const query = useQuery(shipmentsOptions(identity.scopeId))
  const products = useQuery(productsOptions())
  const client = useQueryClient()
  const router = useRouter()
  const [filter, setFilter] = useState<string>(identity.savedFilter)
  const [selected, setSelected] = useState<string | null>(null)

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['shipments', identity.scopeId] }),
      client.invalidateQueries({ queryKey: ['products'] }),
    ])
    router.refresh()
  }

  const transition = useMutation({ mutationFn: transitionShipment, onSuccess: refresh })
  const price = useMutation({ mutationFn: updatePrice, onSuccess: refresh })
  const preferences = useMutation({ mutationFn: updatePreferences, onSuccess: refresh })

  if (query.isPending) {
    return <p>Loading queue…</p>
  }

  if (query.isError) {
    return (
      <>
        <p role="alert">{query.error.message}</p>
        <button onClick={() => query.refetch()}>Try again</button>
      </>
    )
  }

  const chosen = query.data.find((row) => row.id === selected)

  return (
    <>
      <QueueCount scopeId={identity.scopeId} />
      <label>
        Status filter
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {['queued', 'packed', 'dispatched', 'delivered'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <section>
        <h2>Shipment queue</h2>
        <ul>
          {query.data
            .filter((row) => filter === 'all' || row.status === filter)
            .map((row) => (
              <li key={row.id}>
                <button onClick={() => setSelected(row.id)}>{row.id}</button> · {row.customer} ·{' '}
                <span>{row.status}</span>
                {row.status === 'queued' && (
                  <button
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, status: 'packed' })}
                  >
                    Pack {row.id}
                  </button>
                )}
                {row.status === 'packed' && (
                  <button
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, status: 'dispatched' })}
                  >
                    Dispatch {row.id}
                  </button>
                )}
              </li>
            ))}
        </ul>
        {query.data.filter((row) => filter === 'all' || row.status === filter).length === 0 && (
          <p>No shipments match this filter.</p>
        )}
      </section>
      {chosen && (
        <section>
          <h2>Selected shipment</h2>
          <p>
            {chosen.id}: {chosen.status}
          </p>
        </section>
      )}
      <section>
        <h2>Products</h2>
        {products.data?.map((product) => (
          <div key={product.id}>
            <p>
              {product.name}: {formatCurrency(product.price)}
            </p>
            {identity.role === 'supervisor' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  price.mutate({
                    id: product.id,
                    price: Number(new FormData(e.currentTarget).get('price')),
                  })
                }}
              >
                <label>
                  {product.name} price in cents
                  <input type="number" name="price" min="1" defaultValue={product.price} />
                </label>
                <button disabled={price.isPending}>Update {product.name}</button>
              </form>
            )}
          </div>
        ))}
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          preferences.mutate({
            preference: String(new FormData(e.currentTarget).get('preference')),
            savedFilter: String(new FormData(e.currentTarget).get('savedFilter')),
          })
        }}
      >
        <label>
          Delivery speed
          <select name="preference" defaultValue={identity.preference}>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>
        <label>
          Default queue status
          <select name="savedFilter" defaultValue={identity.savedFilter}>
            {['all', 'queued', 'packed', 'dispatched', 'delivered'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button disabled={preferences.isPending}>Save preferences</button>
      </form>
      {[transition.error, price.error, preferences.error, products.error]
        .filter(Boolean)
        .map((error, i) => (
          <p key={i} role="alert">
            {error?.message}
          </p>
        ))}
      <p role="status">
        {transition.isSuccess || price.isSuccess || preferences.isSuccess ? 'Saved.' : ''}
      </p>
    </>
  )
}
