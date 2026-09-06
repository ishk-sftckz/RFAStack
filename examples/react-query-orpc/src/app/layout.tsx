import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { AppNav } from '@/shared/ui/AppNav'
import { Icon } from '@/shared/ui/Icon'
import { QueryProvider } from '@/shared/ui/QueryProvider'
import './style.css'

export const metadata = {
  title: 'B2B ordering',
  description: 'A clear path from request to approval.',
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
            <Link className="brand" href="/" aria-label="B2B ordering">
              <span className="brand-mark">
                <Icon />
              </span>
              <span>
                B2B ordering<small>RFAStack / Company purchasing</small>
              </span>
            </Link>
            <Suspense
              fallback={
                <nav aria-label="Main">
                  <Link href="/">Overview</Link>
                  <Link href="/account">Workspace</Link>
                  <Link href="/sign-in">Sign in</Link>
                </nav>
              }
            >
              <AppNav accountLabel="Workspace" />
            </Suspense>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <QueryProvider>{children}</QueryProvider>
        </main>
        <footer className="site-footer">
          <span>RFAStack examples</span>
          <span>Company purchasing · Demo workspace</span>
        </footer>
      </body>
    </html>
  )
}
