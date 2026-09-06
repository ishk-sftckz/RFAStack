import { z } from 'zod'

export const orderStatusSchema = z.enum(['pending', 'shipped', 'cancelled'])

export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderInputSchema = z.object({ orderId: z.string().min(1).max(100) })

export const itemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().int(),
  quantity: z.number().int().positive(),
})

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  total: z.number().int(),
  items: itemSchema.array(),
  createdAt: z.string(),
})

export type Order = z.infer<typeof orderSchema>
