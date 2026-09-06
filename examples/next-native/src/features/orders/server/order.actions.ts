'use server'

import { headers } from 'next/headers'
import { refresh, updateTag } from 'next/cache'
import { cancelOrder } from './cancel-order.use-case'
import { failure } from '@/shared/utils/errors'

export async function cancelAction(_previous: { message: string }, form: FormData) {
  try {
    const scopeId = await cancelOrder({ orderId: form.get('orderId') }, await headers())
    updateTag(`orders:${scopeId}`)
    refresh()

    return { message: 'Order cancelled.' }
  } catch (error) {
    return { message: failure(error).error }
  }
}
