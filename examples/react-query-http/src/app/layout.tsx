import Link from 'next/link'
import type { ReactNode } from 'react'
import './style.css'
import { QueryProvider } from '@/shared/ui/QueryProvider'

export const metadata = {
  title: 'Fulfillment dashboard',
  description: 'A runnable RFAStack example.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/">Fulfillment dashboard</Link>
          <nav aria-label="Main">
            <Link href="/account">My account</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
        </header>
        <main id="main">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </body>
    </html>
  )
}
