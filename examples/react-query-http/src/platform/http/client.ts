export async function request(path: string, input?: unknown) {
  const response = await fetch(path, {
    method: input ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(input ? { body: JSON.stringify(input) } : {}),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error ?? 'Request failed.')
  }

  return result
}
