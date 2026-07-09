import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { db } from '@/lib/db'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DEFAULT_LIMITS = {
  api: { windowMs: 60_000, maxRequests: 60 },
  upload: { windowMs: 60_000, maxRequests: 10 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
}

let cachedLimits: typeof DEFAULT_LIMITS | null = null
let cachedLimitsTime = 0
const LIMITS_CACHE_TTL = 5 * 60_000 // 5 minutes

async function loadLimits(): Promise<typeof DEFAULT_LIMITS> {
  const now = Date.now()
  if (cachedLimits && now - cachedLimitsTime < LIMITS_CACHE_TTL) return cachedLimits
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['rate_limit_api_max', 'rate_limit_upload_max', 'rate_limit_auth_max'] } },
    })
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    cachedLimits = {
      api: { windowMs: 60_000, maxRequests: parseInt(map.rate_limit_api_max) || DEFAULT_LIMITS.api.maxRequests },
      upload: { windowMs: 60_000, maxRequests: parseInt(map.rate_limit_upload_max) || DEFAULT_LIMITS.upload.maxRequests },
      auth: { windowMs: 15 * 60 * 1000, maxRequests: parseInt(map.rate_limit_auth_max) || DEFAULT_LIMITS.auth.maxRequests },
    }
    cachedLimitsTime = now
    return cachedLimits
  } catch {
    return DEFAULT_LIMITS
  }
}

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

class LazyRateLimiter {
  private key: keyof typeof DEFAULT_LIMITS
  private instance: RateLimiter | null = null
  private instanceTime = 0

  constructor(key: keyof typeof DEFAULT_LIMITS) {
    this.key = key
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    if (!this.instance || now - this.instanceTime >= LIMITS_CACHE_TTL) {
      const limits = await loadLimits()
      this.instance = new RateLimiter(limits[this.key])
      this.instanceTime = now
    }
    return this.instance.limit(identifier)
  }
}

export const apiLimiter = new LazyRateLimiter('api') as unknown as RateLimiter
export const uploadLimiter = new LazyRateLimiter('upload') as unknown as RateLimiter
export const authLimiter = new LazyRateLimiter('auth') as unknown as RateLimiter

export function getClientIdentifier(request: Request): string {
  // Check proxy/cloudflare headers first (most authoritative)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return `ip:${cfIp}`

  const vercelIp = request.headers.get('x-vercel-ip')
  if (vercelIp) return `ip:${vercelIp}`

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    if (ip && ip !== 'unknown') return `ip:${ip}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp && realIp !== 'unknown') return `ip:${realIp}`

  // Last resort: fingerprint based on available headers to prevent collapsing to a single key
  const ua = request.headers.get('user-agent') || ''
  const url = new URL(request.url)
  const pathPrefix = url.pathname.split('/').slice(0, 3).join('/')
  const uaHash = simpleHash(`${ua}:${pathPrefix}`)
  return `fp:${uaHash}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}