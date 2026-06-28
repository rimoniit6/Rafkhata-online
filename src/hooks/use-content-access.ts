'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api-client'

interface ContentAccessResult {
  hasAccess: boolean
  isLoading: boolean
  isPremium: boolean
  hasPurchased: boolean
  pendingPayment: boolean
  accessReason?: string | null
}

/**
 * Simple LRU cache with a max size limit.
 * Prevents unbounded memory growth in the access check cache.
 * Evicts the least recently used entry when over capacity.
 */
class LRUMap<V> {
  private readonly max: number
  private readonly map: Map<string, V>

  constructor(max: number) {
    this.max = max
    this.map = new Map()
  }

  get(key: string): V | undefined {
    const value = this.map.get(key)
    if (value === undefined) return undefined
    // Move to end (most recently used) by re-inserting
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: string, value: V): void {
    // If key already exists, delete first to update insertion order
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    // Evict oldest entry if at capacity
    if (this.map.size >= this.max) {
      const oldestKey = this.map.keys().next().value
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey)
      }
    }
    this.map.set(key, value)
  }

  delete(key: string): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  keys(): IterableIterator<string> {
    return this.map.keys()
  }
}

/** Cache to avoid repeated API calls for the same content (LRU, max 100 entries) */
const accessCache = new LRUMap<ContentAccessResult>(100)

export function useContentAccess(contentType: string, contentId: string): ContentAccessResult {
  const { user } = useAuthStore()
  const [result, setResult] = useState<ContentAccessResult>({
    hasAccess: false,
    isLoading: true,
    isPremium: false,
    hasPurchased: false,
    pendingPayment: false,
  })
  const isFetching = useRef(false)

  useEffect(() => {
    if (!user) {
      setResult({ hasAccess: false, isLoading: false, isPremium: false, hasPurchased: false, pendingPayment: false })
      return
    }

    const cacheKey = `${user.id}-${contentType}-${contentId}`
    const cached = accessCache.get(cacheKey)
    if (cached) {
      setResult(cached)
      return
    }

    if (isFetching.current) return
    isFetching.current = true

    setResult(prev => ({ ...prev, isLoading: true }))

    const fetchAccess = async () => {
      try {
        const response = await api.get<{ purchased: boolean; pendingPayment: boolean; reason?: string | null }>(
          'payment/check',
          { userId: user.id, contentType, contentId },
          { retries: 1, retryDelay: 1000 }  // idempotent GET — safe to retry
        )
        // Handle both wrapped ({ success, data }) and flat response formats
        const data = (response as any).data || response
        const accessResult: ContentAccessResult = {
          hasAccess: data.purchased ?? false,
          isLoading: false,
          isPremium: true,
          hasPurchased: data.purchased ?? false,
          pendingPayment: data.pendingPayment ?? false,
          accessReason: data.reason ?? null,
        }
        accessCache.set(cacheKey, accessResult)
        setResult(accessResult)
      } catch {
        setResult({ hasAccess: false, isLoading: false, isPremium: false, hasPurchased: false, pendingPayment: false })
      } finally {
        isFetching.current = false
      }
    }

    fetchAccess()
  }, [user, contentType, contentId])

  return result
}

export function clearAccessCache(userId?: string) {
  if (userId) {
    for (const key of accessCache.keys()) {
      if (key.startsWith(userId)) accessCache.delete(key)
    }
  } else {
    accessCache.clear()
  }
}
