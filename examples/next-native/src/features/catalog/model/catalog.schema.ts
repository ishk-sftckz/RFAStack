import { z } from 'zod'

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
})

export type Product = z.infer<typeof productSchema>
