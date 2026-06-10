import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  '/api/upload',
]

const ADMIN_ROUTES = ['/api/admin/']

const SUPER_ADMIN_ROUTES = [
  '/api/admin/database/reset',
  '/api/admin/database/export',
  '/api/admin/database/import',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')
  )
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const role = user.user_metadata?.role || 'student'

  if (isSuperAdminRoute(pathname)) {
    if (role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'এই কাজের জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
  }

  if (isAdminRoute(pathname)) {
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'এই কাজের জন্য অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-role', role)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/api/:path*'],
}
