import type { Product } from '@/features/catalog/model/catalog.schema'
import { QuantityInput } from '@/shared/ui/QuantityInput'
import { Icon } from '@/shared/ui/Icon'
import { formatCurrency } from '@/shared/utils/currency'

export function CheckoutItem({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
}) {
  return (
    <div className="product-row">
      <span className="product-icon">
        <Icon name="bag" />
      </span>
      <div className="product-info">
        <strong>{product.name}</strong>
        <small>{formatCurrency(product.price)} / item</small>
      </div>
      <QuantityInput name={product.name} value={quantity} onChange={onQuantityChange} />
    </div>
  )
}
