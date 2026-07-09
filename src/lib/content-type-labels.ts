import { db } from '@/lib/db'

// Server-side content type label resolver
// Caches content types with a TTL to prevent stale data when new types are added to DB
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cachedLabels: Record<string, string> | null = null
let cachedValidTypes: string[] | null = null
let cacheTimestamp: number = 0

function isCacheExpired(): boolean {
  return Date.now() - cacheTimestamp > CACHE_TTL_MS
}

export async function getContentTypeLabels(): Promise<Record<string, string>> {
  if (cachedLabels && !isCacheExpired()) return cachedLabels

  const contentTypes = await db.contentType.findMany({
    where: { isActive: true },
    select: { key: true, labelBn: true },
  })

  cachedLabels = Object.fromEntries(
    contentTypes.map(ct => [ct.key, ct.labelBn])
  )
  cacheTimestamp = Date.now()

  return cachedLabels
}

/**
 * Get the list of valid content type keys from the DB.
 * Used by payment API routes to validate contentType dynamically.
 * Includes special variants (board-mcq, board-cq) that are derived from base types.
 * Cache auto-refreshes every 5 minutes or on explicit invalidation.
 */
export async function getValidContentTypes(): Promise<string[]> {
  if (cachedValidTypes && !isCacheExpired()) return cachedValidTypes

  const contentTypes = await db.contentType.findMany({
    where: { isActive: true },
    select: { key: true },
  })

  cachedValidTypes = contentTypes.map(ct => ct.key)
  // Include 'course' as it's not in the content_types table but needed for course purchases
  if (!cachedValidTypes.includes('course')) {
    cachedValidTypes.push('course')
  }
  cacheTimestamp = Date.now()
  return cachedValidTypes
}

// Get a single label by key (with fallback)
export async function getContentTypeLabel(key: string): Promise<string> {
  const labels = await getContentTypeLabels()
  return labels[key] || key
}

// Invalidate cache (e.g., after admin updates content types)
export function invalidateContentTypeLabelsCache() {
  cachedLabels = null
  cachedValidTypes = null
  cacheTimestamp = 0
}
