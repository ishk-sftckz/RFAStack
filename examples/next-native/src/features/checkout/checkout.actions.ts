'use server'

import { headers } from 'next/headers'
import { refresh, updateTag } from 'next/cache'
import { createOrder } from '@/features/orders/create-order.use-case'
import { failure } from '@/shared/utils/errors'

export async function checkoutAction(_previous: { message: string }, form: FormData) {
  try {
    const result = await createOrder(JSON.parse(String(form.get('items'))), await headers())
    updateTag(`orders:${result.scopeId}`)
    refresh()

    return { message: `Order placed: ${result.id}` }
  } catch (error) {
    return { message: failure(error).error }
  }
}
