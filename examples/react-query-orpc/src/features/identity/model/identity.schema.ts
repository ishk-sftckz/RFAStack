import { z } from 'zod'

export const identitySchema = z.object({
  userId: z.string(),
  name: z.string(),
  scopeId: z.string(),
  role: z.string(),
  preference: z.string(),
})

export type Identity = z.infer<typeof identitySchema>

export const preferenceSchema = z.object({ preference: z.enum(['standard', 'express']) })
