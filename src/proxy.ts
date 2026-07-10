import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { csrfMiddleware } from '@/lib/csrf'
import { db } from '@/lib/db'

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function generateNonce(): string {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return Buffer.from(buffer).toString('base64')
}

const PUBLIC_API_ROUTES = [
  '/api/auth/callback',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/classes',

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
  '/api/teacher-moderators',
  '/api/hierarchy/metadata',
  '/api/favicon',
  '/api/content-types',
  '/api/content-types/seed',
  '/api/uploadthing',
  '/api/csrf-token',
  '/api/health',
  '/api/navigation',
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

function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const cspNonce = nonce || generateNonce()
  const scriptSrc = `'self' 'nonce-${cspNonce}' https://cdn.jsdelivr.net ${getSupabaseUrl()}`

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
    `connect-src 'self' ${getSupabaseUrl()} https://utfs.io https://api.uploadthing.com https://*.ingest.uploadthing.com; ` +
    `frame-src 'self' ${getSupabaseUrl()}; ` +
    `base-uri 'self'; ` +
    `form-action 'self';`
  )
  response.headers.set('x-csp-nonce', cspNonce)
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  const cspNonce = generateNonce()

  if (isPublicPageRoute(pathname)) {
    request.headers.set('x-csp-nonce', cspNonce)
    request.cookies.set('x-csp-nonce', cspNonce)
    return addSecurityHeaders(NextResponse.next({ request: { headers: request.headers } }), cspNonce)
  }

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

    const isCsrfExempt =
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/api/uploadthing') ||
      pathname.startsWith('/api/csrf-token')
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)

    if (!isCsrfExempt && isMutating) {
      const csrfResult = await csrfMiddleware(request)
      if (!csrfResult.valid) {
        const errorResponse = NextResponse.json(
          { success: false, error: 'CSRF টোকেন বৈধ নয়।', code: 'CSRF_INVALID' },
          { status: 403 }
        )
        return addSecurityHeaders(errorResponse, cspNonce)
      }
    }

    let role = user.user_metadata?.role || 'STUDENT'
    try {
      const dbUser = await db.user.findUnique({
        where: { supabaseUserId: user.id },
        select: { role: true },
      })
      if (dbUser?.role) role = dbUser.role
    } catch {
      // Fall back to user_metadata role if DB query fails
    }

    request.headers.set('x-user-id', user.id)
    request.headers.set('x-user-role', role)
    request.headers.set('x-csp-nonce', cspNonce)

    const response = NextResponse.next({
      request: { headers: request.headers },
    })
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return addSecurityHeaders(response, cspNonce)
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin/')) {
    let role = user.user_metadata?.role || 'STUDENT'
    try {
      const dbUser = await db.user.findUnique({
        where: { supabaseUserId: user.id },
        select: { role: true },
      })
      if (dbUser?.role) role = dbUser.role
    } catch {
      // Fall back to user_metadata role if DB query fails
    }
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  request.headers.set('x-csp-nonce', cspNonce)
  request.cookies.set('x-csp-nonce', cspNonce)
  const response = NextResponse.next({ request: { headers: request.headers } })
  supabaseResponse.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })
  return addSecurityHeaders(response, cspNonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|public).*)',
  ],
}
