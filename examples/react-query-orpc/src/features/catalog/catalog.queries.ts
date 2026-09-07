import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { withMembership } from '@/features/membership/membership.queries'
import { product } from './catalog.table'
import { productSchema } from './model/catalog.schema'

export const listProducts = withMembership(({ scopeId }) => listCachedProducts(scopeId))

async function listCachedProducts(scopeId: string) {
  'use cache'

  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`catalog:${scopeId}`)
  traceRead('company-catalog', scopeId)

  return productSchema
    .array()
    .parse(
      await database
        .select()
        .from(product)
        .where(eq(product.scopeId, scopeId))
        .orderBy(asc(product.id)),
    )
}

export const listCurrentProducts = withMembership(async ({ scopeId }) => {
  return productSchema
    .array()
    .parse(await database.select().from(product).where(eq(product.scopeId, scopeId)))
})

export async function getRecommendations() {
  'use cache: private'

  cacheLife({ stale: 30 })
  return getRecommendationsForRequest(await headers())
}

const getRecommendationsForRequest = withMembership(async (membership) => {
  cacheTag(`preferences:${membership.userId}`)
  traceRead('suggested-reorders', membership.scopeId)

  return {
    preference: membership.preference,
    products: productSchema
      .array()
      .parse(
        await database
          .select()
          .from(product)
          .where(eq(product.scopeId, membership.scopeId))
          .orderBy(asc(product.id))
          .limit(2),
      ),
  }
})
