import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createHash } from 'crypto'

// Generate a CSP nonce
function generateNonce(): string {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return Buffer.from(buffer).toString('base64')
}

const PUBLIC_API_ROUTES = [
  '/api/auth/callback',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/classes',
  '/api/subjects',
  '/api/chapters',
  '/api/lectures',
  '/api/mcq',
  '/api/cq',
  '/api/banners',
  '/api/notices',
  '/api/bundles',
  '/api/suggestions',
  '/api/packages',
  '/api/board-questions',
  '/api/board-years',
  '/api/boards',
  '/api/years',
  '/api/courses',
  '/api/faqs',
  '/api/testimonials',
  '/api/plans',
  '/api/search',
  '/api/exams',
  '/api/mcq-exam-packages',
  '/api/cq-exam-packages',
  '/api/payment/content-info',
  '/api/payment/check',
  '/api/payment/batch-check',
  '/api/payment/accounts',
  '/api/content/bundles-for',
  '/api/config',
  '/api/stats',
  '/api/hierarchy/metadata',
  '/api/favicon',
  '/api/content-types',
  '/api/content-types/seed',
  '/api/uploadthing',
]

const PUBLIC_PAGE_ROUTES = [
  '/',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/sitemap.xml',
  '/robots.txt',
]

const ADMIN_ROUTES = ['/admin', '/api/admin/']

const SUPER_ADMIN_ROUTES = [
  '/api/admin/database/reset',
  '/api/admin/database/export',
  '/api/admin/database/import',
]

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')
  )
}

function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  )
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const cspNonce = nonce || generateNonce()
  const scriptSrc = nonce 
    ? `'self' 'nonce-${cspNonce}' https://cdn.jsdelivr.net https://eylbmvqyrtkfcnfsienv.supabase.co`
    : `'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://eylbmvqyrtkfcnfsienv.supabase.co`
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src ${scriptSrc}; ` +
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: https: blob:; ` +
    `connect-src 'self' https://eylbmvqyrtkfcnfsienv.supabase.co https://utfs.io https://api.uploadthing.com; ` +
    `frame-src 'self' https://eylbmvqyrtkfcnfsienv.supabase.co; ` +
    `base-uri 'self'; ` +
    `form-action 'self';`
  )
  if (nonce) {
    response.headers.set('x-csp-nonce', cspNonce)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Generate CSP nonce for this request
  const cspNonce = generateNonce()

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return addSecurityHeaders(NextResponse.next(), cspNonce)
  }

  // Allow public page routes
  if (isPublicPageRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next(), cspNonce)
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname)) {
      return addSecurityHeaders(NextResponse.next(), cspNonce)
    }

    const { supabaseResponse, user } = await updateSession(request)

    if (!user) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
      return addSecurityHeaders(errorResponse, cspNonce)
    }

    const role = user.user_metadata?.role || 'student'

    if (isSuperAdminRoute(pathname)) {
      if (role !== 'super_admin') {
        const errorResponse = NextResponse.json(
          { success: false, error: 'এই কাজের জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
          { status: 403 }
        )
        return addSecurityHeaders(errorResponse, cspNonce)
      }
    }

    if (isAdminRoute(pathname)) {
      if (role !== 'admin' && role !== 'super_admin') {
        const errorResponse = NextResponse.json(
          { success: false, error: 'এই কাজের জন্য অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
          { status: 403 }
        )
        return addSecurityHeaders(errorResponse, cspNonce)
      }
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', role)

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    })
    return addSecurityHeaders(response, cspNonce)
  }

  // For all other routes (protected pages), verify session
  const { supabaseResponse, user } = await updateSession(request)

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin page protection
  if (isAdminRoute(pathname)) {
    const role = user.user_metadata?.role || 'student'
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response, cspNonce)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|public).*)',
  ],
}
