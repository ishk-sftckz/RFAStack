const server = Bun.serve({
  port: 4101,
  fetch(request) {
    if (new URL(request.url).pathname === '/estimate') {
      return Response.json({ days: 3 })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.info(`Carrier simulator on ${server.port}`)
