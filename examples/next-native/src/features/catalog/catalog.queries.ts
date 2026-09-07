import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { asc } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { withMembership } from '@/features/membership/membership.queries'
import { product } from './catalog.table'
import { productSchema } from './model/catalog.schema'

export async function listProducts() {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag('catalog')
  traceRead('catalog')

  return productSchema.array().parse(await database.select().from(product).orderBy(asc(product.id)))
}

export async function getRecommendations() {
  'use cache: private'

  cacheLife({ stale: 30 })
  return getRecommendationsForRequest(await headers())
}

const getRecommendationsForRequest = withMembership(async (membership) => {
  cacheTag(`preferences:${membership.userId}`)
  traceRead('recommendations', membership.scopeId)
  const products = await database.select().from(product).orderBy(asc(product.id))

  return {
    preference: membership.preference,
    products: productSchema
      .array()
      .parse(
        products.slice(
          membership.preference === 'express' ? 1 : 0,
          membership.preference === 'express' ? 3 : 2,
        ),
      ),
  }
})
// Checkout obtains current prices through a public feature operation, without display caching.
export const listCurrentProducts = withMembership(async () => {
  return productSchema.array().parse(await database.select().from(product))
})
