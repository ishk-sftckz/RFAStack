import 'server-only'
import { os, ORPCError } from '@orpc/server'
import { AccessError } from '@/shared/utils/errors'

export const procedure = os.$context<{ headers: Headers }>().use(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof AccessError) {
      const codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
      } as const
      throw new ORPCError(codes[error.status], { message: error.message })
    }

    throw error
  }
})
