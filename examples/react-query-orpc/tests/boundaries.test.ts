import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const checker = resolve('scripts/check-boundaries.ts')

const cases = [
  [
    'public query',
    'src/app/page.tsx',
    "import { read } from '@/features/orders/server/order.queries'",
    true,
  ],
  [
    'public action from a client',
    'src/app/page.tsx',
    "'use client'; import { cancel } from '@/features/orders/server/order.actions'",
    true,
  ],
  [
    'public use case across features',
    'src/features/checkout/server/checkout.actions.ts',
    "import { create } from '@/features/orders/server/create-order.use-case'",
    true,
  ],
  [
    'RPC mounting',
    'src/app/api/rpc/router.ts',
    "export { router } from '@/features/orders/server/order.rpc'",
    true,
  ],
  [
    'internal helper within its owner',
    'src/features/membership/server/membership.queries.ts',
    "import { verify } from './session'",
    true,
  ],
  [
    'platform auth setup',
    'src/app/api/auth/route.ts',
    "import { createAuthProvider } from '@/platform/auth/server'",
    true,
  ],
  [
    'auth provider outside the auth endpoint',
    'src/app/page.tsx',
    "import { authProvider } from '@/features/auth/server/auth.provider'",
    false,
  ],
  [
    'private helper across features',
    'src/features/orders/server/order.queries.ts',
    "import { verify } from '../../membership/server/session'",
    false,
  ],
  [
    'private re-export',
    'src/app/membership.ts',
    "export { verify } from '@/features/membership/server/session'",
    false,
  ],
  [
    'private dynamic import',
    'src/app/page.tsx',
    "const helper = import('@/features/membership/server/session')",
    false,
  ],
  [
    'normalized private path',
    'src/app/page.tsx',
    "import { auth } from '@/features/membership/ui/../server/auth.ts'",
    false,
  ],
  [
    'platform importing a feature',
    'src/platform/auth/index.ts',
    "import { user } from '@/features/auth/server/auth.table'",
    false,
  ],
  [
    'client importing a server read',
    'src/app/page.tsx',
    "'use client'; import { read } from '@/features/orders/server/order.queries'",
    false,
  ],
  [
    'frontend importing backend',
    'src/features/membership/server/membership.queries.ts',
    "import { auth } from '@backend/platform/auth'",
    false,
  ],
  [
    'auth provider mounted by its endpoint',
    'src/app/api/auth/route.ts',
    "import { authProvider } from '@/features/auth/server/auth.provider'",
    true,
  ],
  [
    'business call cannot use the auth provider',
    'src/features/membership/server/membership.queries.ts',
    "import { authProvider } from '@/features/auth/server/auth.provider'",
    false,
  ],
  [
    'business call cannot use RPC procedures',
    'src/features/checkout/server/checkout.use-case.ts',
    "import { router } from '@/features/orders/server/order.rpc'",
    false,
  ],
  [
    'foreign key schema reference',
    'src/features/membership/server/membership.table.ts',
    "import { user } from '@/features/auth/server/auth.table'; export const membership = pgTable('membership', { userId: text().references(() => user.id) })",
    true,
  ],
  [
    'a table cannot query another feature table',
    'src/features/membership/server/membership.table.ts',
    "import { user } from '@/features/auth/server/auth.table'; database.select().from(user)",
    false,
  ],
  [
    'a table cannot re-export another feature table',
    'src/features/membership/server/membership.table.ts',
    "export { user } from '@/features/auth/server/auth.table'",
    false,
  ],
  [
    'queries cannot import a foreign table',
    'src/features/membership/server/membership.queries.ts',
    "import { user } from '@/features/auth/server/auth.table'",
    false,
  ],
] as const

test.each(cases)('%s follows the dependency rules', (_name, file, source, allowed) => {
  const directory = mkdtempSync(join(tmpdir(), 'rfa-boundaries-'))
  try {
    const fixture = join(directory, file)
    mkdirSync(dirname(fixture), { recursive: true })
    writeFileSync(fixture, source)
    const result = spawnSync('bun', [checker], { cwd: directory, encoding: 'utf8' })
    expect(result.error).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(allowed ? 0 : 1)
    if (!allowed) expect(result.stderr).toContain(file)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
