async function handle(request: Request) {
  const url = new URL(request.url)
  const response = await fetch(`${process.env.BACKEND_URL}${url.pathname}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'POST' ? await request.text() : undefined,
    redirect: 'manual',
    cache: 'no-store',
  })
  const headers = new Headers(response.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')

  return new Response(response.body, { status: response.status, headers })
}

export { handle as GET, handle as POST }
