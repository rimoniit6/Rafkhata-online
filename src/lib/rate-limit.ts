import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { db } from '@/lib/db'

let cachedRedis: Redis | null | undefined

function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED')
    cachedRedis = null
    return null
  }
  cachedRedis = new Redis({ url, token })
  return cachedRedis
}

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
  private ratelimit: Ratelimit | null
  private maxRequests: number

  constructor(config: RateLimiterConfig) {
    const redis = getRedis()
    this.maxRequests = config.maxRequests
    this.ratelimit = redis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.maxRequests, `${toSeconds(config.windowMs)} s`),
          analytics: true,
          prefix: 'ratelimit',
        })
      : null
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    // Graceful fallback: if Redis is unavailable, allow the request rather
    // than crashing every rate-limited route.
    if (!this.ratelimit) {
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests, reset: Date.now() + 60_000 }
    }
    try {
      const result = await this.ratelimit.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      console.error('[rate-limit] Redis error, allowing request:', error instanceof Error ? error.message : error)
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests, reset: Date.now() + 60_000 }
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
  // Only trust cf-connecting-ip when explicitly behind Cloudflare —
  // otherwise attackers can spoof it to bypass rate limiting entirely.
  if (process.env.TRUST_CLOUDFLARE_HEADERS === 'true') {
    const cfIp = request.headers.get('cf-connecting-ip')
    if (cfIp) return `ip:${cfIp}`
  }

  // On Vercel (and most trusted proxies) x-real-ip is set/overwritten by the
  // platform and cannot be spoofed by the client.
  const realIp = request.headers.get('x-real-ip')
  if (realIp && realIp !== 'unknown') return `ip:${realIp}`

  // x-forwarded-for is platform-managed on Vercel; the first entry is the client.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    if (ip && ip !== 'unknown') return `ip:${ip}`
  }

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
