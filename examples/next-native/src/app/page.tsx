import Link from 'next/link'
import { Suspense } from 'react'
import { listProducts } from '@/features/catalog/server/catalog.queries'
import { formatCurrency } from '@/shared/utils/currency'

async function Catalog() {
  const products = await listProducts()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name} · {formatCurrency(product.price)}
        </li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <>
      <h1>Order supplies</h1>
      <p>Browse the catalog, then sign in to place an order.</p>
      <Suspense fallback={<p>Loading catalog…</p>}>
        <Catalog />
      </Suspense>
      <Link href="/account">Open your account</Link>
    </>
  )
}
