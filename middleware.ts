import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role as string | undefined

    // Admin routes — only ADMIN
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Provider routes — only PROVIDER
    if (pathname.startsWith('/provider') && role !== 'PROVIDER') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Seeker routes — only SEEKER
    if (pathname.startsWith('/seeker') && role !== 'SEEKER') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const protectedPrefixes = ['/admin', '/provider', '/seeker', '/redirect', '/profile']
        if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/provider/:path*', '/seeker/:path*', '/redirect', '/profile'],
}
