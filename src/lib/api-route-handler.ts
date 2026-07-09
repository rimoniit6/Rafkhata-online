/**
 * Standardized API route handler factory.
 *
 * Ensures consistent patterns across all API routes:
 * - Auth guards (withAuth, withAdmin, withCsrf)
 * - Rate limiting
 * - Validation (validateBody)
 * - Error handling (handleApiError)
 * - Response formatting (apiResponse, paginatedApiResponse)
 * - Cache headers
 *
 * Usage:
 *   export const GET = createRouteHandler({
 *     auth: false,
 *     handler: async () => { ... }
 *   })
 *
 *   export const POST = createRouteHandler({
 *     auth: 'required',
 *     csrf: true,
 *     rateLimit: true,
 *     validate: mySchema,
 *     handler: async ({ data, user }) => { ... }
 *   })
 */

import { NextResponse } from 'next/server'
import type { Role } from '@prisma/client'
import { ZodSchema } from 'zod'
import { requireAuth, requireAdmin, type AuthResult, hasRole } from './auth'
import { validateBody, apiResponse, paginatedApiResponse, apiError, unauthorized, forbidden, withCsrf, applyRateLimit, parsePaginationParams, type PaginationInput } from './api-utils'
import { apiLimiter } from './rate-limit'
import { handleApiError, AppError } from './errors'
import { cacheHeaders } from './cache-headers'
type CacheConfig = Record<string, string>

type HandlerContext = {
  user: AuthResult
  data: unknown
  params: Record<string, string | string[] | undefined>
}

type RouteHandler<T = unknown> = (context: HandlerContext) => Promise<NextResponse>

type AuthMode = false | 'optional' | 'required' | 'admin' | 'super-admin'

interface RouteConfig {
  auth?: AuthMode
  csrf?: boolean
  rateLimit?: boolean
  roles?: Role[]
  validate?: ZodSchema
  cache?: keyof typeof cacheHeaders.public | keyof typeof cacheHeaders.private | 'noCache'
  handler: RouteHandler
}

export function createRouteHandler(config: RouteConfig) {
  return async (request: Request, { params }: { params?: Promise<Record<string, string>> } = {}) => {
    try {
      const resolvedParams = params ? await params : {}

      if (config.csrf) {
        const csrfResult = await withCsrf(request)
        if ('error' in csrfResult) return csrfResult.error
      }

      let user: AuthResult | null = null
      if (config.auth === 'required') {
        const authResult = await requireAuth(request)
        user = authResult
      } else if (config.auth === 'admin') {
        const authResult = await requireAdmin(request)
        user = authResult
      } else if (config.auth === 'super-admin') {
        const { requireSuperAdmin } = await import('./auth')
        user = await requireSuperAdmin(request)
      } else if (config.auth === 'optional') {
        try {
          user = await requireAuth(request)
        } catch {
          user = null
        }
      }

      if (config.roles && user) {
        if (!hasRole(user.user, ...config.roles)) {
          return forbidden()
        }
      }

      if (config.rateLimit) {
        const rateCheck = await applyRateLimit(apiLimiter, request)
        if ('error' in rateCheck) return rateCheck.error
      }

      let data: unknown = undefined
      if (config.validate) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          const body = await request.json().catch(() => ({}))
          const result = validateBody(config.validate, body)
          if ('error' in result) return result.error
          data = result.data
        }
      }

      const context: HandlerContext = {
        user: user!,
        data,
        params: resolvedParams,
      }

      const response = await config.handler(context)

      if (config.cache) {
        if (config.cache === 'noCache') {
          const headers = { ...Object.fromEntries(response.headers), ...cacheHeaders.noCache }
          return new NextResponse(response.body, { status: response.status, headers })
        }
        const cacheConfig = cacheHeaders.public[config.cache as keyof typeof cacheHeaders.public]
          || cacheHeaders.private[config.cache as keyof typeof cacheHeaders.private]
        if (cacheConfig) {
          const headers = { ...Object.fromEntries(response.headers), ...cacheConfig }
          return new NextResponse(response.body, { status: response.status, headers })
        }
      }

      return response
    } catch (error) {
      return handleApiError(error, `${request.method} ${request.url}`)
    }
  }
}

export { apiResponse, paginatedApiResponse, apiError, unauthorized, forbidden, handleApiError, AppError, cacheHeaders, parsePaginationParams }
export type { PaginationInput, CacheConfig }
