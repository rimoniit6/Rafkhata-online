/**
 * Rate limiting utility.
 * 
 * Production note: This uses in-memory storage which resets on server restart
 * and doesn't share state across instances. For multi-instance deployments,
 * replace the store with Redis/Upstash using the same RateLimiter interface.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class MemoryStore {
  private entries = new Map<string, RateLimitEntry>()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.entries) {
        if (now > entry.resetTime) {
          this.entries.delete(key)
        }
      }
    }, 60_000)
  }

  get(key: string): RateLimitEntry | undefined {
    return this.entries.get(key)
  }

  set(key: string, entry: RateLimitEntry): void {
    this.entries.set(key, entry)
  }

  delete(key: string): void {
    this.entries.delete(key)
  }

  /** @deprecated — cleanup happens automatically */
  reset(key: string): void {
    this.entries.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface RateLimiterConfig {
  /** Time window in seconds */
  windowMs: number
  /** Maximum number of requests per window */
  maxRequests: number
}

// Singleton store shared across all limiters
const store = new MemoryStore()

export class RateLimiter {
  private windowMs: number
  private maxRequests: number

  constructor(config: RateLimiterConfig) {
    this.windowMs = config.windowMs * 1000
    this.maxRequests = config.maxRequests
  }

  limit(identifier: string): RateLimitResult {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // New window
      const resetTime = now + this.windowMs
      store.set(identifier, { count: 1, resetTime })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetTime,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    entry.count++
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }
}

// Pre-configured limiters for common use cases
export const apiLimiter = new RateLimiter({ windowMs: 60, maxRequests: 60 }) // 60 requests per minute
export const uploadLimiter = new RateLimiter({ windowMs: 60, maxRequests: 10 }) // 10 uploads per minute

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback — not ideal but prevents crashes
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}
