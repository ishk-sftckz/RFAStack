import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { database } from '@/platform/database/client'
import { traceRead } from '@/platform/observability/trace'
import { requireIdentity } from '@/features/identity/server/identity.queries'
import { product } from './catalog.table'
import { productSchema } from '../model/catalog.schema'

export async function listProducts(requestHeaders: Headers) {
  const identity = await requireIdentity(requestHeaders)

  return listCachedProducts(identity.scopeId)
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
  const identity = await requireIdentity(requestHeaders)

  return productSchema
    .array()
    .parse(await database.select().from(product).where(eq(product.scopeId, identity.scopeId)))
}

export async function getRecommendations() {
  'use cache: private'

  cacheLife({ stale: 30 })
  const identity = await requireIdentity(await headers())
  cacheTag(`preferences:${identity.userId}`)
  traceRead('suggested-reorders', identity.scopeId)

  return {
    preference: identity.preference,
    products: productSchema
      .array()
      .parse(
        await database
          .select()
          .from(product)
          .where(eq(product.scopeId, identity.scopeId))
          .orderBy(asc(product.id))
          .limit(2),
      ),
  }
}
