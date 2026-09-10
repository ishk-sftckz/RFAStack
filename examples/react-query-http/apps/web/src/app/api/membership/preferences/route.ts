import { revalidateTag } from 'next/cache'
import { savePreferences } from '@/features/membership/preferences.use-case'
import { AccessError, failure } from '@/shared/utils/errors'

export async function POST(request: Request) {
  try {
    if (request.headers.get('Origin') !== process.env.BETTER_AUTH_URL) {
      throw new AccessError(403, 'Untrusted request origin.')
    }

    const result = await savePreferences(await request.json(), request.headers)
    revalidateTag(result.tag, { expire: 0 })

    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const result = failure(error)

    return Response.json(result, { status: result.status })
  }
}
