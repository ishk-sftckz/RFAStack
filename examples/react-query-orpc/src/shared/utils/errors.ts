export class AccessError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409,
    message: string,
  ) {
    super(message)
  }
}
