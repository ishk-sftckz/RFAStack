import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { requireMembership } from '@/features/membership/membership.queries'
import { product } from './catalog.table'
import { productSchema } from './model/catalog.schema'

export async function listProducts(requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)

  return listCachedProducts(membership.scopeId)
}

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

export async function listCurrentProducts(requestHeaders: Headers) {
  const membership = await requireMembership(requestHeaders)

  return productSchema
    .array()
    .parse(await database.select().from(product).where(eq(product.scopeId, membership.scopeId)))
}

export async function getRecommendations() {
  'use cache: private'

  cacheLife({ stale: 30 })
  const membership = await requireMembership(await headers())
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
}
