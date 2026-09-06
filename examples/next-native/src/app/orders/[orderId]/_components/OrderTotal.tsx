import { getOrder } from '@/features/orders/order.queries'
import { formatCurrency } from '@/shared/utils/currency'

export async function OrderTotal({ id }: { id: string }) {
  const order = await getOrder(id)

  return <p>Total: {formatCurrency(order.total)}</p>
}
