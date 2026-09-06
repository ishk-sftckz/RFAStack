import { afterAll, expect, test } from 'vitest'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { database, pool } from '@backend/platform/database/client'
import { user, account, session } from '@backend/features/auth/server/auth.table'
import { authProvider } from '@backend/features/auth/server/auth.provider'
import { requireSession } from '@backend/features/auth/server/auth.queries'
import { requireMembership } from '@backend/features/membership/server/membership.queries'
import { membership } from '@backend/features/membership/server/membership.table'

afterAll(() => pool.end())

test('a valid auth session requires membership for account access', async () => {
  const id = crypto.randomUUID()
  const email = `${id}@example.test`
  const password = 'Demo-password-123!'
  await database.transaction(async (tx) => {
    await tx.insert(user).values({ id, name: 'Visitor', email, emailVerified: true })
    await tx.insert(account).values({
      id,
      accountId: id,
      userId: id,
      providerId: 'credential',
      password: await hashPassword(password),
    })
  })
  try {
    const response = await authProvider.handler(
      new Request(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: process.env.BETTER_AUTH_URL! },
        body: JSON.stringify({ email, password }),
      }),
    )
    expect(response.status).toBe(200)
    const headers = new Headers({
      cookie: response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(';')[0])
        .join('; '),
    })
    expect(await requireSession(headers)).toEqual({ userId: id, name: 'Visitor' })
    await expect(requireMembership(headers)).rejects.toMatchObject({ status: 403 })

    await database
      .insert(membership)
      .values({ userId: id, scopeId: 'test-scope', role: 'operator' })
    await expect(requireMembership(headers)).resolves.toMatchObject({
      userId: id,
      scopeId: 'test-scope',
    })
    await database
      .update(session)
      .set({ expiresAt: new Date(0) })
      .where(eq(session.userId, id))
    await expect(requireSession(headers)).rejects.toMatchObject({ status: 401 })
  } finally {
    await database.delete(user).where(eq(user.id, id))
  }
  expect(await database.select().from(membership).where(eq(membership.userId, id))).toEqual([])
})
