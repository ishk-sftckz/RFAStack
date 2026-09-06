'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { shipmentsOptions, productsOptions } from '../fulfillment.query-options'
import { transitionShipment, updatePrice, updatePreferences } from '../fulfillment.api'
import type { Identity } from '@/features/identity/model/identity.schema'
import { formatCurrency } from '@/shared/utils/currency'

export function Dashboard({ identity }: { identity: Identity }) {
  const query = useQuery(shipmentsOptions(identity.scopeId))
  const products = useQuery(productsOptions())
  const client = useQueryClient()
  const router = useRouter()
  const [filter, setFilter] = useState<string>(identity.savedFilter)
  const [search, setSearch] = useState('')
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
  const visible = query.data.filter(
    (row) =>
      (filter === 'all' || row.status === filter) &&
      `${row.id} ${row.customer}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <>
      <div className="stats" aria-label="Shipment overview">
        <div className="stat">
          <span>Queue total</span>
          <strong>{query.data.length}</strong>
        </div>
        <div className="stat accent">
          <span>Ready to pack</span>
          <strong>{query.data.filter((row) => row.status === 'queued').length}</strong>
        </div>
        <div className="stat">
          <span>In transit</span>
          <strong>{query.data.filter((row) => row.status === 'dispatched').length}</strong>
        </div>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <h2>Shipment queue</h2>
            <p className="hint">Select a shipment to see its progress.</p>
          </div>
          <span className="badge">Updates every 5s</span>
        </div>
        <div className="toolbar">
          <label className="search">
            Search shipments
            <input
              type="search"
              placeholder="Shipment ID or customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Status filter
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {['queued', 'packed', 'dispatched', 'delivered'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          {visible.length} of {query.data.length} shipments
        </p>
        <ul className="record-list">
          {visible.map((row) => (
            <li className={`record ${selected === row.id ? 'selected-record' : ''}`} key={row.id}>
              <div className="record-top">
                <button
                  className="button-link record-id"
                  aria-pressed={selected === row.id}
                  onClick={() => setSelected(row.id)}
                >
                  {row.id}
                </button>
                <span className="badge" data-status={row.status}>
                  {row.status}
                </span>
              </div>
              <p className="hint">{row.customer}</p>
              <div className="actions">
                {row.status === 'queued' && (
                  <button
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, status: 'packed' })}
                  >
                    <span aria-hidden="true">Pack shipment</span>
                    <span className="sr-only">Pack {row.id}</span>
                  </button>
                )}
                {row.status === 'packed' && (
                  <button
                    disabled={transition.isPending}
                    onClick={() => transition.mutate({ id: row.id, status: 'dispatched' })}
                  >
                    <span aria-hidden="true">Dispatch shipment</span>
                    <span className="sr-only">Dispatch {row.id}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {visible.length === 0 && (
          <div className="empty">
            <p>
              {search.trim()
                ? 'No shipments match your search.'
                : 'No shipments match this filter.'}
            </p>
            <button
              className="button-secondary"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <p role="alert">{transition.error?.message}</p>
        <p role="status">{transition.isSuccess ? 'Shipment updated.' : ''}</p>
      </section>
      {chosen && (
        <section>
          <div className="section-heading">
            <h2>Selected shipment</h2>
            <button className="button-secondary" onClick={() => setSelected(null)}>
              Close details
            </button>
          </div>
          <p>
            {chosen.id}: {chosen.status}
          </p>
          <p className="muted">Customer: {chosen.customer}</p>
          <ol className="shipment-progress" aria-label="Shipment progress">
            {['queued', 'packed', 'dispatched', 'delivered'].map((status, index) => (
              <li
                key={status}
                data-complete={
                  index <= ['queued', 'packed', 'dispatched', 'delivered'].indexOf(chosen.status)
                }
                aria-current={status === chosen.status ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                {status}
              </li>
            ))}
          </ol>
        </section>
      )}
      <div className="grid">
        <section>
          <h2>Products</h2>
          <p className="hint">
            {identity.role === 'supervisor'
              ? 'Review prices and save changes for each product.'
              : 'Current product prices for reference.'}
          </p>
          {products.isPending && <p role="status">Loading products…</p>}
          {products.isError && (
            <>
              <p role="alert">{products.error.message}</p>
              <button className="button-secondary" onClick={() => products.refetch()}>
                Retry products
              </button>
            </>
          )}
          {products.data?.length === 0 && <p className="empty">No products available.</p>}
          {products.data?.map((product) => (
            <div className="record" key={product.id}>
              <p>
                {product.name}: {formatCurrency(product.price)}
              </p>
              {identity.role === 'supervisor' && (
                <form
                  className="inline-form"
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
                    <input
                      type="number"
                      name="price"
                      min="1"
                      required
                      defaultValue={product.price}
                    />
                  </label>
                  <button disabled={price.isPending}>Update {product.name}</button>
                </form>
              )}
            </div>
          ))}
          <p role="alert">{price.error?.message}</p>
          <p role="status">{price.isSuccess ? 'Price updated.' : ''}</p>
        </section>
        <section>
          <h2>Workspace preferences</h2>
          <p className="hint">Set delivery speed and the filter used when you return.</p>
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
          <p role="alert">{preferences.error?.message}</p>
          <p role="status">{preferences.isSuccess ? 'Preferences saved.' : ''}</p>
        </section>
      </div>
    </>
  )
}
