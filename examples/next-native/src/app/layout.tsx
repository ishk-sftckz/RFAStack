import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { AppNav } from '@/shared/ui/AppNav'
import { Icon } from '@/shared/ui/Icon'

import './style.css'

export const metadata = {
  title: 'Customer order portal',
  description: 'Your everyday supplies, all in one place.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="Customer order portal">
              <span className="brand-mark">
                <Icon />
              </span>
              <span>
                Customer order portal<small>RFAStack / Customer portal</small>
              </span>
            </Link>
            <Suspense
              fallback={
                <nav aria-label="Main">
                  <Link href="/">Overview</Link>
                  <Link href="/account">My account</Link>
                  <Link href="/sign-in">Sign in</Link>
                </nav>
              }
            >
              <AppNav accountLabel="My account" />
            </Suspense>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <span>RFAStack examples</span>
          <span>Customer portal · Demo workspace</span>
        </footer>
      </body>
    </html>
  )
}
