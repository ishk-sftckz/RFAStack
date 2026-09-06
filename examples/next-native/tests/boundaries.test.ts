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
    "import { read } from '@/features/orders/order.queries'",
    true,
  ],
  [
    'public action from a client',
    'src/app/page.tsx',
    "'use client'; import { cancel } from '@/features/orders/order.actions'",
    true,
  ],
  [
    'public use case across features',
    'src/features/checkout/checkout.actions.ts',
    "import { create } from '@/features/orders/create-order.use-case'",
    true,
  ],
  [
    'RPC mounting',
    'src/app/api/rpc/router.ts',
    "export { router } from '@/features/orders/order.rpc'",
    true,
  ],
  [
    'internal helper within its owner',
    'src/features/membership/membership.queries.ts',
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
    "import { authProvider } from '@/features/auth/auth.provider'",
    false,
  ],
  [
    'private helper across features',
    'src/features/orders/order.queries.ts',
    "import { verify } from '../membership/session'",
    false,
  ],
  [
    'private re-export',
    'src/app/membership.ts',
    "export { verify } from '@/features/membership/session'",
    false,
  ],
  [
    'private dynamic import',
    'src/app/page.tsx',
    "const helper = import('@/features/membership/session')",
    false,
  ],
  [
    'normalized private path',
    'src/app/page.tsx',
    "import { auth } from '@/features/membership/ui/../auth.ts'",
    false,
  ],
  [
    'platform importing a feature',
    'src/platform/auth/index.ts',
    "import { user } from '@/features/auth/auth.table'",
    false,
  ],
  [
    'client importing a server read',
    'src/app/page.tsx',
    "'use client'; import { read } from '@/features/orders/order.queries'",
    false,
  ],
  [
    'frontend importing backend',
    'src/features/membership/membership.queries.ts',
    "import { auth } from '@backend/platform/auth'",
    false,
  ],
  [
    'auth provider mounted by its endpoint',
    'src/app/api/auth/route.ts',
    "import { authProvider } from '@/features/auth/auth.provider'",
    true,
  ],
  [
    'business call cannot use the auth provider',
    'src/features/membership/membership.queries.ts',
    "import { authProvider } from '@/features/auth/auth.provider'",
    false,
  ],
  [
    'business call cannot use RPC procedures',
    'src/features/checkout/checkout.use-case.ts',
    "import { router } from '@/features/orders/order.rpc'",
    false,
  ],
  [
    'foreign key schema reference',
    'src/features/membership/membership.table.ts',
    "import { user } from '@/features/auth/auth.table'; export const membership = pgTable('membership', { userId: text().references(() => user.id) })",
    true,
  ],
  [
    'a table cannot query another feature table',
    'src/features/membership/membership.table.ts',
    "import { user } from '@/features/auth/auth.table'; database.select().from(user)",
    false,
  ],
  [
    'a table cannot re-export another feature table',
    'src/features/membership/membership.table.ts',
    "export { user } from '@/features/auth/auth.table'",
    false,
  ],
  [
    'queries cannot import a foreign table',
    'src/features/membership/membership.queries.ts',
    "import { user } from '@/features/auth/auth.table'",
    false,
  ],
  [
    'server component reads within its feature',
    'src/features/orders/ui/OrderDetails.tsx',
    "import { read } from '../order.queries'",
    true,
  ],
  [
    'client cannot read within its feature',
    'src/features/orders/ui/OrderDetails.tsx',
    "'use client'; import { read } from '../order.queries'",
    false,
  ],
  [
    'client cannot import a use case',
    'src/features/orders/ui/CancelOrder.tsx',
    "'use client'; import { cancel } from '../cancel-order.use-case.ts'",
    false,
  ],
  [
    'client may import an action with its extension',
    'src/features/orders/ui/CancelOrder.tsx',
    "'use client'; import { cancel } from '../order.actions.ts'",
    true,
  ],
  [
    'client may import browser query options',
    'src/app/page.tsx',
    "'use client'; import { options } from '@/features/orders/order.query-options'",
    true,
  ],
  [
    'client may import the feature model',
    'src/features/orders/ui/CancelOrder.tsx',
    "'use client'; import { canCancel } from '../model/order-cancellation'",
    true,
  ],
  [
    'client may import RPC types',
    'src/features/orders/order.client.ts',
    "'use client'; import type { orderRouter } from './order.rpc'",
    true,
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

test('client imports respect server-only markers on ordinary feature helpers', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rfa-boundaries-'))
  try {
    const feature = join(directory, 'src/features/orders')
    mkdirSync(feature, { recursive: true })
    writeFileSync(
      join(feature, 'credential.ts'),
      "import 'server-only'; export const token = 'private'",
    )
    writeFileSync(
      join(feature, 'order.client.ts'),
      "'use client'; import { token } from './credential'",
    )
    const result = spawnSync('bun', [checker], { cwd: directory, encoding: 'utf8' })
    expect(result.error).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(1)
    expect(result.stderr).toContain('client imports server implementation')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
