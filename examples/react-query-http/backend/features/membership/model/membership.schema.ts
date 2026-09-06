import { z } from 'zod'

export const membershipSchema = z.object({
  userId: z.string(),
  name: z.string(),
  scopeId: z.string(),
  role: z.string(),
  preference: z.string(),
  savedFilter: z.enum(['all', 'queued', 'packed', 'dispatched', 'delivered']),
})

export type Membership = z.infer<typeof membershipSchema>

export const preferenceSchema = z.object({
  preference: z.enum(['standard', 'express']),
  savedFilter: z.enum(['all', 'queued', 'packed', 'dispatched', 'delivered']).default('all'),
})
