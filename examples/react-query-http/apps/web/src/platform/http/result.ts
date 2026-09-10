import { AccessError } from '@/shared/utils/errors'

type HttpError = { status: number; value: unknown }

export function readResult<T>(
  result: { data: T; error: null } | { data: null; error: HttpError },
): T {
  if (result.error) {
    const value = result.error.value
    const message =
      typeof value === 'object' &&
      value !== null &&
      'error' in value &&
      typeof value.error === 'string'
        ? value.error
        : 'Request failed.'
    throw new AccessError(result.error.status, message)
  }
  return result.data
}
