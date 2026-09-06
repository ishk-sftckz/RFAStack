import { z } from 'zod'

export const decisionSchema = z.object({
  orderId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
})

export const scopeSchema = z.object({ scopeId: z.string().min(1) })
