import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = Buffer.from(request.headers.get('X-Signature') ?? '')
  const expected = Buffer.from(
    createHmac('sha256', process.env.INTEGRATION_SECRET!).update(body).digest('hex'),
  )

  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const parsed = z
    .object({ tag: z.string().regex(/^(catalog|warehouse:[a-z-]+)$/), immediate: z.boolean() })
    .safeParse(JSON.parse(body))

  if (!parsed.success) {
    return new Response('Invalid event', { status: 400 })
  }

  revalidateTag(parsed.data.tag, parsed.data.immediate ? { expire: 0 } : 'max')

  return Response.json({ ok: true })
}
