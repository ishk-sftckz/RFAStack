import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { AppNav } from '@/shared/ui/AppNav'
import { Icon } from '@/shared/ui/Icon'
import { QueryProvider } from '@/shared/ui/QueryProvider'
import './style.css'

export const metadata = {
  title: 'Fulfillment dashboard',
  description: 'Keep every shipment moving.',
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
            <Link className="brand" href="/" aria-label="Fulfillment dashboard">
              <span className="brand-mark">
                <Icon />
              </span>
              <span>
                Fulfillment dashboard<small>RFAStack / Fulfillment</small>
              </span>
            </Link>
            <Suspense
              fallback={
                <nav aria-label="Main">
                  <Link href="/">Overview</Link>
                  <Link href="/account">Dashboard</Link>
                  <Link href="/sign-in">Sign in</Link>
                </nav>
              }
            >
              <AppNav accountLabel="Dashboard" />
            </Suspense>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <QueryProvider>{children}</QueryProvider>
        </main>
        <footer className="site-footer">
          <span>RFAStack examples</span>
          <span>Fulfillment · Demo workspace</span>
        </footer>
      </body>
    </html>
  )
}
