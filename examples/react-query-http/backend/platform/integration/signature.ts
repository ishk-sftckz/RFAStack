import { createHmac, timingSafeEqual } from 'node:crypto'

export function validSignature(body: string, signature: string | null) {
  if (!signature) {
    return false
  }

  const expected = createHmac('sha256', process.env.INTEGRATION_SECRET!).update(body).digest('hex')
  const supplied = Buffer.from(signature)

  return supplied.length === expected.length && timingSafeEqual(supplied, Buffer.from(expected))
}
