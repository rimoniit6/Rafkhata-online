/**
 * Analytics Query Cache
 *
 * In-memory cache for expensive Prisma aggregation queries.
 * Each entry has a configurable TTL (time-to-live in milliseconds).
 * After TTL expires, the next call re-computes the value.
 *
 * Usage:
 *   const data = await cache.getOrCompute('revenue-daily', 300_000, () =>
 *     db.payment.aggregate({ ... })
 *   )
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class AnalyticsQueryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private hits = 0
  private misses = 0

  async getOrCompute<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const existing = this.store.get(key)

    if (existing && existing.expiresAt > now) {
      this.hits++
      return existing.data as T
    }

    this.misses++
    const data = await fn()
    this.store.set(key, { data, expiresAt: now + ttlMs })
    return data
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidateAll(): void {
    this.store.clear()
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? Math.round((this.hits / (this.hits + this.misses)) * 10000) / 100
        : 0,
    }
  }
}

export const analyticsCache = new AnalyticsQueryCache()

export function cacheControlHeader(ttlSeconds = 60): Record<string, string> {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
  }
}
