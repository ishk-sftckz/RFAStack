import { queryOptions } from '@tanstack/react-query'
import { fetchShipments, fetchProducts } from './fulfillment.api'

export const shipmentsOptions = (scopeId: string) =>
  queryOptions({
    queryKey: ['shipments', scopeId],
    queryFn: ({ signal }) => fetchShipments(signal),
    staleTime: 30000,
    refetchInterval: 5000,
  })

export const productsOptions = () =>
  queryOptions({
    queryKey: ['products'],
    queryFn: ({ signal }) => fetchProducts(signal),
    staleTime: 30000,
  })
