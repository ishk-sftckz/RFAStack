import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { router } from '../src/app/api/rpc/router'

const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3103'

const response = await fetch(`${base}/api/auth/sign-in/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base },
  body: JSON.stringify({
    email: process.env.DEMO_EMAIL ?? 'alice@example.test',
    password: process.env.DEMO_PASSWORD ?? 'Demo-password-123!',
  }),
})

if (!response.ok) {
  throw new Error(`Sign-in failed (${response.status})`)
}

const cookie = response.headers
  .getSetCookie()
  .map((value) => value.split(';')[0])
  .join('; ')

const client: RouterClient<typeof router> = createORPCClient(
  new RPCLink({ url: `${base}/api/rpc`, headers: { Cookie: cookie, Origin: base } }),
)

try {
  const result =
    process.argv[2] === 'submit'
      ? await client.orders.submit({
          items: [{ productId: process.argv[3] ?? 'notebook-a', quantity: 1 }],
        })
      : await client.orders.list({ scopeId: process.env.COMPANY_ID ?? 'company-a' })
  console.info(JSON.stringify(result, null, 2))
} finally {
  await fetch(`${base}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: cookie, Origin: base },
  })
}
