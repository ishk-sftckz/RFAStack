import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (
    !request.cookies.has('rfa-fulfillment.session_token') &&
    !request.cookies.has('__Secure-rfa-fulfillment.session_token')
  ) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/account/:path*', '/orders/:path*'] }
