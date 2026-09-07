import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Cookie presence only guides this redirect; feature operations verify the session.
  if (!getSessionCookie(request, { cookiePrefix: 'rfa-fulfillment' })) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/account/:path*', '/orders/:path*'] }
