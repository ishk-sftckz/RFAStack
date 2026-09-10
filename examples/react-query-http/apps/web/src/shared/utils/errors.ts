import { ZodError } from 'zod'

export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function failure(error: unknown) {
  if (error instanceof AccessError) {
    return { status: error.status, error: error.message }
  }

  if (error instanceof ZodError || error instanceof SyntaxError) {
    return { status: 400, error: 'Check the submitted values.' }
  }

  console.error(error)

  return { status: 500, error: 'Unable to complete the request.' }
}
