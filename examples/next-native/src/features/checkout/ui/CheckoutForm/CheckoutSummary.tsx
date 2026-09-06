import type { Product } from '@/features/catalog/model/catalog.schema'
import { formatCurrency } from '@/shared/utils/currency'
import { ActionForm } from '@/shared/ui/ActionForm'
import { checkoutAction } from '../../server/checkout.actions'

export function CheckoutSummary({
  products,
  quantities,
}: {
  products: Product[]
  quantities: Record<string, number>
}) {
  const items = products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({ productId: product.id, quantity: quantities[product.id] }))
  const total = products.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 0),
    0,
  )

  return (
    <div className="draft-summary">
      <p className="total-line">
        Estimated total: <strong className="price">{formatCurrency(total)}</strong>
      </p>
      <p className="hint">Demo purchase. No payment is taken.</p>
      <ActionForm action={checkoutAction} label="Place order" disabled={items.length === 0}>
        <input type="hidden" name="items" value={JSON.stringify({ items })} />
      </ActionForm>
    </div>
  )
}
