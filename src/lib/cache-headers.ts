/**
 * Cache control header presets for API routes.
 *
 * Usage:
 *   return NextResponse.json(data, { headers: cacheHeaders.public.short })
 *   return NextResponse.json(data, { headers: cacheHeaders.public.medium })
 *   return NextResponse.json(data, { headers: cacheHeaders.public.long })
 *   return NextResponse.json(data, { headers: cacheHeaders.private.short })
 */

type CacheConfig = {
  'Cache-Control': string
  'CDN-Cache-Control'?: string
  'Surrogate-Control'?: string
  'X-Cache-TTL'?: string
}

function buildPublic(seconds: number, staleSeconds?: number): CacheConfig {
  const stale = staleSeconds ?? Math.floor(seconds / 2)
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${stale}, must-revalidate`,
    ...(seconds >= 60 ? { 'CDN-Cache-Control': `public, s-maxage=${seconds}` } : {}),
    'X-Cache-TTL': String(seconds),
  }
}

function buildPrivate(seconds: number): CacheConfig {
  return {
    'Cache-Control': `private, s-maxage=${seconds}, max-age=${Math.floor(seconds / 2)}`,
    'X-Cache-TTL': String(seconds),
  }
}

function buildNoCache(): CacheConfig {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Cache-TTL': '0',
  }
}

export const cacheHeaders = {
  /** Public content that changes rarely */
  public: {
    /** 30s — content that may update periodically (banners) */
    short: buildPublic(30, 30),
    /** 5min — content that updates occasionally (classes, subjects) */
    medium: buildPublic(300, 600),
    /** 1h — static reference data (boards, years, FAQs) */
    long: buildPublic(3600, 7200),
    /** 1d — almost never changes */
    day: buildPublic(86400, 86400),
  },
  /** User-specific content */
  private: {
    short: buildPrivate(10),
    medium: buildPrivate(60),
  },
  noCache: buildNoCache(),
} as const
