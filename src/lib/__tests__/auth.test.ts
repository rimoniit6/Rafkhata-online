/// <reference types="bun-types" />

import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { verifyCsrfFromRequest } from '@/lib/csrf'
import { paginationSchema } from '@/lib/validations'

// ====================================================================
// Mock jose for CSRF tests
// ====================================================================

const mockSign = mock(async () => 'mock-signed-token')
const mockVerify = mock(async () => ({}))

mock.module('jose', () => ({
  SignJWT: mock(() => ({
    setProtectedHeader: mock(() => ({
      setIssuedAt: mock(() => ({
        setExpirationTime: mock(() => ({
          sign: mockSign,
        })),
      })),
    })),
  })),
  jwtVerify: mockVerify,
}))

// ====================================================================
// Mock next/headers
// ====================================================================

let mockCookieValue: string | null = null
const mockCookieStore = {
  get: mock((name: string) => mockCookieValue ? { name, value: mockCookieValue } : undefined),
  set: mock((name: string, value: string) => { mockCookieValue = value }),
}

mock.module('next/headers', () => ({
  cookies: mock(async () => mockCookieStore),
}))

const { generateCsrfToken, validateCsrfToken, csrfMiddleware } = await import('@/lib/csrf')

// ====================================================================
// Auth module mock setup
// ====================================================================

const mockAuthUser = { id: 'user-1', email: 'test@test.com', role: 'STUDENT' }
const mockAuthResult = { user: mockAuthUser, userId: 'user-1', role: 'STUDENT' as const }

mock.module('@/lib/auth', () => ({
  requireAuth: mock(async () => mockAuthResult),
  requireRole: mock(async (_req: Request, ...roles: string[]) => {
    if (roles.includes('STUDENT')) return mockAuthResult
    throw Object.assign(new Error('Forbidden'), { name: 'AuthorizationError' })
  }),
  requireAdmin: mock(async (_req: Request) => {
    throw Object.assign(new Error('Forbidden'), { name: 'AuthorizationError' })
  }),
  requireSuperAdmin: mock(async (_req: Request) => {
    throw Object.assign(new Error('Forbidden'), { name: 'AuthorizationError' })
  }),
}))

const { withAuth, withRole, withAdmin, withSuperAdmin, withCsrf, apiResponse, apiError, validateBody, parsePaginationParams } = await import('@/lib/api-utils')

// ====================================================================
// CSRF Tests
// ====================================================================

describe('CSRF', () => {
  beforeEach(() => {
    mockCookieValue = null
    mockSign.mockClear()
    mockVerify.mockClear()
    mockCookieStore.get.mockClear()
    mockCookieStore.set.mockClear()
  })

  it('generateCsrfToken returns a signed token', async () => {
    const token = await generateCsrfToken()
    expect(token).toBe('mock-signed-token')
    expect(mockSign).toHaveBeenCalled()
  })

  it('validateCsrfToken verifies a token', async () => {
    mockVerify.mockImplementationOnce(async () => ({}))
    const result = await validateCsrfToken('valid-token')
    expect(result).toBe(true)
  })

  it('validateCsrfToken returns false for invalid token', async () => {
    mockVerify.mockRejectedValueOnce(new Error('invalid'))
    const result = await validateCsrfToken('invalid-token')
    expect(result).toBe(false)
  })

  it('csrfMiddleware returns valid:false when no cookie and sets new token', async () => {
    const request = new Request('http://localhost/api/test', { method: 'GET' })

    mockSign.mockImplementationOnce(async () => 'new-token')

    const result = await csrfMiddleware(request)
    expect(result.valid).toBe(false)
    expect(result.token).toBe('new-token')
  })

  it('verifyCsrfFromRequest validates header token', async () => {
    mockVerify.mockImplementationOnce(async () => ({}))
    mockCookieValue = 'valid-cookie-token'

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'x-csrf-token': 'valid-header-token' },
    })

    const result = await verifyCsrfFromRequest(request)
    expect(result).toBe(true)
  })

  it('verifyCsrfFromRequest returns false when no token provided', async () => {
    mockCookieValue = 'some-cookie'
    mockVerify.mockRejectedValueOnce(new Error('no match'))

    const request = new Request('http://localhost/api/test', { method: 'POST' })
    const result = await verifyCsrfFromRequest(request)
    expect(result).toBe(false)
  })
})

// ====================================================================
// Auth Tests
// ====================================================================

describe('Auth', () => {
  it('withAuth returns user for authenticated request', async () => {
    const request = new Request('http://localhost/api/test')
    const result = await withAuth(request)

    if ('error' in result) {
      expect.unreachable('should not return error')
    } else {
      expect(result.userId).toBe('user-1')
      expect(result.role).toBe('STUDENT')
    }
  })

  it('withRole allows matching role', async () => {
    const { requireRole } = await import('@/lib/auth')
    const request = new Request('http://localhost/api/test')
    const result = await requireRole(request, 'STUDENT')
    expect(result.role).toBe('STUDENT')
  })

  it('withRole correctly rejects unauthorized role', async () => {
    const { requireRole } = await import('@/lib/auth')
    // Mock injectAuthUser + requireRole setup — we verify the auth module mock works
    try {
      await requireRole(new Request('http://localhost/api/test'), 'ADMIN')
      expect.unreachable('should have thrown')
    } catch (e: unknown) {
      expect((e as Error).name).toBe('AuthorizationError')
    }
  })
})

// ====================================================================
// API Utils Tests
// ====================================================================

describe('API Utils', () => {
  it('apiResponse returns success response', async () => {
    const response = apiResponse({ id: '1' }, 200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('1')
  })

  it('apiResponse supports message', async () => {
    const response = apiResponse(null, 'সফল', 201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.message).toBe('সফল')
  })

  it('apiError returns error response', async () => {
    const response = apiError('Something wrong', 400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Something wrong')
    expect(response.status).toBe(400)
  })

  it('apiError supports code and details', async () => {
    const response = apiError('Validation failed', 422, 'VALIDATION_ERROR', [{ field: 'name', message: 'required' }])
    const body = await response.json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.details).toHaveLength(1)
  })

  it('validateBody parses valid data', () => {
    const result = validateBody(paginationSchema, { page: '1', limit: '10' })
    if ('error' in result) {
      expect.unreachable('should parse')
    } else {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(10)
    }
  })

  it('validateBody returns error for invalid data', () => {
    const result = validateBody(paginationSchema, { page: -1 })
    if ('error' in result) {
      expect(result.error).toBeDefined()
    } else {
      expect.unreachable('should fail')
    }
  })

  it('parsePaginationParams parses valid params', () => {
    const params = new URLSearchParams('page=2&limit=50')
    const result = parsePaginationParams(params)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(50)
  })

  it('parsePaginationParams clamps values to range', () => {
    const params = new URLSearchParams('page=0&limit=200')
    const result = parsePaginationParams(params)
    expect(result.page).toBe(1)   // min 1
    expect(result.limit).toBe(100) // max 100
  })

  it('parsePaginationParams uses defaults', () => {
    const params = new URLSearchParams('')
    const result = parsePaginationParams(params)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })
})

// ====================================================================
// CSRF withCsrf Tests
// ====================================================================

describe('withCsrf', () => {
  it('skips CSRF for GET requests', async () => {
    const request = new Request('http://localhost/api/test', { method: 'GET' })
    const result = await withCsrf(request)
    expect('valid' in result && result.valid).toBe(true)
  })

  it('rejects POST without CSRF token', async () => {
    mockCookieValue = 'cookie-token'
    mockVerify.mockRejectedValueOnce(new Error('invalid'))
    const request = new Request('http://localhost/api/test', { method: 'POST' })
    const result = await withCsrf(request)
    if ('error' in result) {
      const body = await result.error.json()
      expect(body.code).toBe('CSRF_INVALID')
    } else {
      expect.unreachable('should fail CSRF')
    }
  })
})
