import Link from 'next/link'
import { Icon } from '@/shared/ui/Icon'
import { listProducts } from '../server/catalog.queries'
import { formatCurrency } from '@/shared/utils/currency'

export async function Catalog() {
  const products = await listProducts()
  return (
    <div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">The catalog</p>
          <h2>Supplies for your next order</h2>
        </div>
        <span className="hint">{products.length} products</span>
      </div>
      <ul className="catalog">
        {products.map((product) => (
          <li key={product.id}>
            <span className="product-icon">
              <Icon name="bag" />
            </span>
            <h3>{product.name}</h3>
            <span className="hint">Price per item</span>
            <span className="price">{formatCurrency(product.price)}</span>
            <Link
              className="back-link"
              href="/account"
              aria-label={`Order supplies: ${product.name}`}
            >
              Order supplies <Icon name="arrow" />
            </Link>
          </li>
        ))}
      </ul>
      {products.length === 0 && (
        <p className="empty">No supplies are available yet. Check back soon.</p>
      )}
    </div>
  )
}
