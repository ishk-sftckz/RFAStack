import { createHmac } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { database } from '@backend/platform/database/client'
import { outbox } from './fulfillment.table'

let running = false

export async function deliverInvalidations() {
  if (running) {
    return
  }

  running = true

  try {
    for (const row of await database.select().from(outbox).limit(50)) {
      const body = JSON.stringify({ tag: row.tag, immediate: Boolean(row.immediate) })

      try {
        const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/invalidate`, {
          method: 'POST',
          body,
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': createHmac('sha256', process.env.INTEGRATION_SECRET!)
              .update(body)
              .digest('hex'),
          },
          signal: AbortSignal.timeout(3000),
        })

        if (response.ok) {
          await database.delete(outbox).where(eq(outbox.id, row.id))
        }
      } catch {
        /* Keep the durable outbox entry for the next attempt. */
      }
    }
  } finally {
    running = false
  }
}
