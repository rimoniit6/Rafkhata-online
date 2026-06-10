import { NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { RateLimiter, getClientIdentifier, rateLimitHeaders, type RateLimitResult } from './rate-limit'
import { requireAuth, requireAdmin, requireSuperAdmin, type AuthResult } from './auth'

export interface PaginationInput {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Standardized API response format
 * Supports both patterns:
 *   apiResponse(data)                              — data only, status 200
 *   apiResponse(data, status)                      — data + numeric status
 *   apiResponse(data, 'message')                   — data + message, status 200
 *   apiResponse(data, 'message', status)            — data + message + status
 *   apiResponse(data, null, status)                 — data + explicit status, no message
 */
export function apiResponse<T>(data: T, messageOrStatus?: string | number | null, status?: number, headers?: Record<string, string>) {
  let message: string | null = null
  let finalStatus = 200

  if (typeof messageOrStatus === 'number') {
    finalStatus = messageOrStatus
  } else if (typeof messageOrStatus === 'string') {
    message = messageOrStatus
    if (status !== undefined) finalStatus = status
  } else if (messageOrStatus === null) {
    if (status !== undefined) finalStatus = status
  }

  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status: finalStatus, ...(headers ? { headers } : {}) }
  )
}

/**
 * Standardized paginated API response
 */
export function paginatedApiResponse<T>(data: T, pagination: PaginationInput, status = 200) {
  return NextResponse.json(
    { success: true, data, pagination },
    { status }
  )
}

/**
 * Standardized error response format
 */
export function apiError(message: string, status = 400, code?: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
    { status }
  )
}

/**
 * Unauthorized response
 */
export function unauthorized(message = 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।') {
  return apiError(message, 401, 'UNAUTHORIZED')
}

/**
 * Forbidden response
 */
export function forbidden(message = 'এই কাজের জন্য অনুমতি নেই।') {
  return apiError(message, 403, 'FORBIDDEN')
}

/**
 * Not found response
 */
export function notFound(message = 'তথ্য খুঁজে পাওয়া যায়নি।') {
  return apiError(message, 404, 'NOT_FOUND')
}

/**
 * Rate limit exceeded response
 */
export function rateLimitExceeded(result: RateLimitResult) {
  const headers = rateLimitHeaders(result)
  return NextResponse.json(
    {
      success: false,
      error: 'অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    { status: 429, headers }
  )
}

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>, body: unknown): { data: T } | { error: NextResponse } {
  try {
    const data = schema.parse(body)
    return { data }
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return { error: apiError('ইনপুট ভ্যালিডেশন ব্যর্থ', 422, 'VALIDATION_ERROR', errors) }
    }
    return { error: apiError('ইনপুট ভ্যালিডেশন ব্যর্থ', 422, 'VALIDATION_ERROR') }
  }
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(limiter: RateLimiter, request: Request): { result: RateLimitResult } | { error: NextResponse } {
  const identifier = getClientIdentifier(request)
  const result = limiter.limit(identifier)
  if (!result.success) {
    return { error: rateLimitExceeded(result) }
  }
  return { result }
}

/**
 * Require authentication for an API route handler
 * Returns the auth result or an error response
 */
export async function withAuth(request: Request): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth(request)
  if (!auth) {
    return unauthorized()
  }
  return auth
}

/**
 * Require admin role for an API route handler
 */
export async function withAdmin(request: Request): Promise<AuthResult | NextResponse> {
  const auth = await requireAdmin(request)
  if (!auth) {
    return unauthorized()
  }
  if (auth instanceof NextResponse) return auth
  if (!auth.isAdmin) {
    return forbidden('এই কাজের জন্য অ্যাডমিন অনুমতি প্রয়োজন।')
  }
  return auth
}

/**
 * Require super admin role for an API route handler
 */
export async function withSuperAdmin(request: Request): Promise<AuthResult | NextResponse> {
  const auth = await requireSuperAdmin(request)
  if (!auth) {
    return unauthorized()
  }
  if (!auth.isSuperAdmin) {
    return forbidden('এই কাজের জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।')
  }
  return auth
}
