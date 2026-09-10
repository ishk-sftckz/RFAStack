'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppNav({ accountLabel }: { accountLabel: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Main">
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
        Overview
      </Link>
      <Link
        href="/account"
        aria-current={
          pathname === '/account' || pathname.startsWith('/orders/') ? 'page' : undefined
        }
      >
        {accountLabel}
      </Link>
      <Link href="/sign-in" aria-current={pathname === '/sign-in' ? 'page' : undefined}>
        Sign in
      </Link>
    </nav>
  )
}
