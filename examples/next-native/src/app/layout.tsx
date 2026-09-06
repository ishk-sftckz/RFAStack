import Link from 'next/link'
import type { ReactNode } from 'react'
import './style.css'

export const metadata = {
  title: 'Customer order portal',
  description: 'A runnable RFAStack example.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/">Customer order portal</Link>
          <nav aria-label="Main">
            <Link href="/account">My account</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
