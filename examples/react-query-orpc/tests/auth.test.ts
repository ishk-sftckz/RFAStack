import { afterAll, expect, test, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { database, pool } from '@/platform/database/client'
import { user, account, session } from '@/features/auth/auth.table'
import { authProvider } from '@/features/auth/auth.provider'
import { requireSession } from '@/features/auth/auth.queries'
import { requireMembership, withMembership } from '@/features/membership/membership.queries'
import type { Membership } from '@/features/membership/model/membership.schema'
import { membership } from '@/features/membership/membership.table'

afterAll(() => pool.end())

test('a valid auth session requires membership for account access', async () => {
  const operation = vi.fn(async (member: Membership, recordId: string, includeItems: boolean) => ({
    scopeId: member.scopeId,
    recordId,
    includeItems,
  }))
  const read = withMembership(operation)
  expect(operation).not.toHaveBeenCalled()
  await expect(read(new Headers(), 'record-1', true)).rejects.toMatchObject({ status: 401 })
  expect(operation).not.toHaveBeenCalled()

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
    await expect(read(headers, 'record-1', true)).rejects.toMatchObject({ status: 403 })
    expect(operation).not.toHaveBeenCalled()

    await database.insert(membership).values({ userId: id, scopeId: 'test-scope', role: 'buyer' })
    await expect(requireMembership(headers)).resolves.toMatchObject({
      userId: id,
      scopeId: 'test-scope',
    })
    await expect(read(headers, 'record-1', true)).resolves.toEqual({
      scopeId: 'test-scope',
      recordId: 'record-1',
      includeItems: true,
    })
    await database
      .update(membership)
      .set({ scopeId: 'updated-scope' })
      .where(eq(membership.userId, id))
    await expect(read(headers, 'record-2', false)).resolves.toEqual({
      scopeId: 'updated-scope',
      recordId: 'record-2',
      includeItems: false,
    })
    expect(operation).toHaveBeenCalledTimes(2)
    const failure = new Error('Read failed')
    await expect(
      withMembership(async () => {
        throw failure
      })(headers),
    ).rejects.toBe(failure)
    await database
      .update(session)
      .set({ expiresAt: new Date(0) })
      .where(eq(session.userId, id))
    await expect(requireSession(headers)).rejects.toMatchObject({ status: 401 })
    await expect(read(headers, 'record-3', true)).rejects.toMatchObject({ status: 401 })
    expect(operation).toHaveBeenCalledTimes(2)
  } finally {
    await database.delete(user).where(eq(user.id, id))
  }
  expect(await database.select().from(membership).where(eq(membership.userId, id))).toEqual([])
})
