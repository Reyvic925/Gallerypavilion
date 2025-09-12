import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const path = req.nextUrl.pathname
    
    console.log('Middleware processing path:', path)

    // Token presence check
    let hasToken = false
    try {
      const authHeader = req.headers.get('authorization')
      const cookieHeader = req.headers.get('cookie') || ''
      const cookieNames = cookieHeader
        .split(';')
        .map(c => c.split('=')[0].trim())
        .filter(Boolean)
      const hasAuthHeader = !!authHeader && authHeader.startsWith('Bearer ')
      const hasAuthCookie = cookieNames.includes('auth-token')
      hasToken = hasAuthHeader || hasAuthCookie || isAuth
      console.debug('[middleware] hasAuthHeader:', hasAuthHeader, 'hasAuthCookie:', hasAuthCookie, 'cookieNames:', cookieNames)
    } catch (e) {
      console.debug('[middleware] token presence check failed')
    }

    // Always allow access to public routes
    if (
      path === '/' ||
      path.startsWith('/api/auth') ||
      path.startsWith('/auth/') ||
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path.includes('/public') ||
      path.startsWith('/api/public') ||
      (path.startsWith('/invite') || (path.includes('/gallery/') && path.includes('/invite')))
    ) {
      console.log('Allowing access to public page')
      return NextResponse.next()
    }

    // Handle auth pages (login, signup, etc.)
    if (path.startsWith('/auth')) {
      if (isAuth && !path.includes('/signup')) {
        // Redirect authenticated users away from auth pages (except signup)
        const redirectUrl = token?.role === 'admin' ? '/admin' : 
                          token?.role === 'client' ? '/client' : '/dashboard'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      return NextResponse.next()
    }

    // Protect admin routes
    if (path.startsWith('/admin')) {
      if (!hasToken || (isAuth && token?.role !== 'admin')) {
        return NextResponse.redirect(new URL('/auth/admin-login', req.url))
      }
    }

    // Protect dashboard routes
    if (path.startsWith('/dashboard')) {
      if (!hasToken || (isAuth && token?.role !== 'photographer')) {
        return NextResponse.redirect(new URL('/auth/photographer-login', req.url))
      }
    }

    // Handle gallery routes
    if (path.startsWith('/gallery') && !path.includes('/demo')) {
      if (!hasToken) {
        return NextResponse.redirect(new URL('/auth/invite', req.url))
      }
    }

    // Protect API routes
    if (path.startsWith('/api/') && !path.startsWith('/api/auth') && !path.startsWith('/api/public')) {
      if (!hasToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public pages
        const publicPaths = ['/', '/auth', '/invite']
        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
        )
        
        if (isPublicPath) return true
        
        // Allow admin routes (will be handled by main middleware function)
        if (req.nextUrl.pathname.startsWith('/admin')) return true
        
        // Require authentication for other protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}