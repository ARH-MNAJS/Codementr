import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// This function will run for every request
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Debug info for authentication issues
  console.log(`[Middleware] Processing request to: ${pathname}`)
  
  // Check if the request is for a protected route
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin')
  
  // Skip middleware for API routes and other non-protected routes
  if (!isProtectedRoute) {
    console.log(`[Middleware] Not a protected route, continuing`)
    return NextResponse.next()
  }

  console.log(`[Middleware] Protected route detected, checking auth token`)
  
  // Get the session token
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    console.log(`[Middleware] Auth token found: ${!!token}`)
    
    // If there's no token, redirect to login page
    if (!token) {
      console.log(`[Middleware] No auth token, redirecting to login`)
      const url = new URL('/login', request.url)
      // Pass the current URL as the callback URL for after login
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      const isAdmin = token.username === process.env.ADMIN_GITHUB_USERNAME
      console.log(`[Middleware] Admin check: ${isAdmin}, username: ${token.username}`)

      if (!isAdmin) {
        // Redirect non-admin users to the dashboard
        console.log(`[Middleware] Not admin, redirecting to dashboard`)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Continue with the request if everything is fine
    console.log(`[Middleware] Auth check passed, continuing`)
    return NextResponse.next()
  } catch (error) {
    console.error(`[Middleware] Auth error:`, error)
    // On error, redirect to login with error flag
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(url)
  }
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