import { z } from 'zod'

export const shipmentSchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  customer: z.string(),
  status: z.enum(['queued', 'packed', 'dispatched', 'delivered']),
})

export const productSchema = z.object({ id: z.string(), name: z.string(), price: z.number().int() })

export type Shipment = z.infer<typeof shipmentSchema>

export type Product = z.infer<typeof productSchema>

export const transitionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['packed', 'dispatched']),
})

export const priceSchema = z.object({
  id: z.string().min(1),
  price: z.number().int().min(1).max(1000000),
})

export type TransitionInput = z.infer<typeof transitionSchema>
export type PriceInput = z.infer<typeof priceSchema>

export const summarySchema = z.object({
  total: z.number().int().nonnegative(),
  dispatched: z.number().int().nonnegative(),
  warehouseId: z.string(),
})
