import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

let cachedSecret: Uint8Array | null = null

function getCsrfSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret
  const secret = process.env.CSRF_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('CSRF_SECRET environment variable must be set and at least 32 characters long')
  }
  cachedSecret = new TextEncoder().encode(secret)
  return cachedSecret
}

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export async function generateCsrfToken(): Promise<string> {
  const random = new Uint8Array(16)
  crypto.getRandomValues(random)
  const token = await new SignJWT({ rnd: Buffer.from(random).toString('base64url') })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getCsrfSecret())
  return token
}

/**
 * Sets the CSRF cookie. Only usable in Route Handlers / Server Actions
 * (NOT in proxy/middleware — `cookies()` is unavailable there).
 */
export async function setCsrfCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  })
}

/** Route Handler / Server Component context only. */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

async function isValidSignedToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getCsrfSecret())
    return true
  } catch {
    return false
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Double-submit validation: the token sent via header/body MUST match the
 * httpOnly cookie AND carry a valid signature. This binds the token to the
 * requesting browser session, so a token leaked or forged elsewhere is useless.
 */
async function validateDoubleSubmit(submittedToken: string | null, cookieToken: string | null): Promise<boolean> {
  if (!submittedToken || !cookieToken) return false
  if (!timingSafeEqual(submittedToken, cookieToken)) return false
  return isValidSignedToken(submittedToken)
}

/**
 * Proxy/middleware-safe CSRF check. Reads the cookie from the NextRequest
 * directly (never via next/headers, which is unavailable in proxy context).
 */
export async function csrfMiddleware(request: NextRequest): Promise<{ valid: boolean }> {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value || null

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (await validateDoubleSubmit(headerToken, cookieToken)) {
    return { valid: true }
  }

  // Fall back to JSON body `_csrf` field for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().json()
        if (typeof body._csrf === 'string' && (await validateDoubleSubmit(body._csrf, cookieToken))) {
          return { valid: true }
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return { valid: false }
}

/**
 * Route Handler variant of the CSRF check (uses next/headers cookies).
 */
export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  const cookieToken = await getCsrfToken()

  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (await validateDoubleSubmit(headerToken, cookieToken)) {
    return true
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().json()
        if (typeof body._csrf === 'string' && (await validateDoubleSubmit(body._csrf, cookieToken))) {
          return true
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return false
}

export function createCsrfTokenInput(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`
}
