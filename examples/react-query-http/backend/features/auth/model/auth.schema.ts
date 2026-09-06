import { z } from 'zod'

export const sessionSchema = z.object({ userId: z.string(), name: z.string() })

export type Session = z.infer<typeof sessionSchema>
