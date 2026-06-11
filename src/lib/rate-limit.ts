import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface RateLimiterConfig {
  windowMs: number
  maxRequests: number
}

function toSeconds(ms: number): number {
  return Math.ceil(ms / 1000)
}

export class RateLimiter {
  private ratelimit: Ratelimit

  constructor(config: RateLimiterConfig) {
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${toSeconds(config.windowMs)} s`),
      analytics: true,
      prefix: 'ratelimit',
    })
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }
}

export const apiLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 60 })
export const uploadLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 10 })
export const authLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}