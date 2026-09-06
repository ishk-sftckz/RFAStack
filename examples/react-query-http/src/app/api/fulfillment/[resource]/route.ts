import { handleFulfillment } from '@/features/fulfillment/server/fulfillment.http'
import { failure } from '@/shared/utils/errors'

async function handle(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    return Response.json(await handleFulfillment(request, (await context.params).resource), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const result = failure(error)

    return Response.json(result, { status: result.status })
  }
}

export { handle as GET, handle as POST }
