import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CONTENT_VERSION_PREFIX = 'content:version:'

/**
 * Content types that have cacheable public API responses.
 * Add new content types here as needed.
 */
export type CacheableContent = 'mcq' | 'cq' | 'lecture' | 'suggestion' | 'exam' | 'bundle' | 'package' | 'notice' | 'faq' | 'banner' | 'board-question' | 'board' | 'class' | 'subject' | 'chapter' | 'settings'

const VALID_CONTENT_TYPES = new Set<string>([
  'mcq', 'cq', 'lecture', 'suggestion', 'exam',
  'bundle', 'package', 'notice', 'faq', 'banner',
  'board-question', 'board', 'class', 'subject', 'chapter', 'settings',
])

/**
 * Bump the content version for a given type.
 * This invalidates all cached responses for that content type.
 * Call this after any admin CRUD operation that modifies the content.
 */
export async function invalidateContentCache(contentType: CacheableContent): Promise<void> {
  if (!VALID_CONTENT_TYPES.has(contentType)) return
  redis.incr(`${CONTENT_VERSION_PREFIX}${contentType}`).catch(() => {
    // Redis unavailable — cache invalidation is best-effort
  })
}

/**
 * Get current content version for a type.
 * Returns 0 if never set.
 */
export async function getContentVersion(contentType: CacheableContent): Promise<number> {
  try {
    const val = await Promise.race([
      redis.get<number>(`${CONTENT_VERSION_PREFIX}${contentType}`),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])
    return val ?? 0
  } catch {
    return 0
  }
}

/**
 * Get content version header for API responses.
 * Client can use this for cache-busting decisions.
 */
export async function contentVersionHeader(contentType: CacheableContent): Promise<Record<string, string>> {
  const version = await getContentVersion(contentType)
  return { 'X-Content-Version': String(version) }
}

/**
 * Invalidate multiple content types at once.
 */
export async function invalidateMultipleCache(types: CacheableContent[]): Promise<void> {
  await Promise.all(types.map(invalidateContentCache))
}
