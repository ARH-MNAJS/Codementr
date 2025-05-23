import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// This function will run for every request
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for a protected route
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin')
  
  // Skip middleware for API routes and other non-protected routes
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get the session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // If there's no token, redirect to login page
  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const isAdmin = token.username === process.env.ADMIN_GITHUB_USERNAME

    if (!isAdmin) {
      // Redirect non-admin users to the dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Continue with the request if everything is fine
  return NextResponse.next()
}

// Configure which paths should run the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /favicon.ico, /site.webmanifest (inside /public)
     */
    '/((?!api|_next|fonts|favicon.ico|site.webmanifest).*)',
  ],
} 