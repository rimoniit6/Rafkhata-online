'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

interface ProgressItem {
  id: string
  contentId: string
  contentType: string
  progress: number
  lastAccessed: string
  contentTitle?: string
}

interface RecentlyViewedItem {
  id: string
  contentId: string
  contentType: string
  title: string
  viewedAt: string
}

export function useProgress() {
  const { user, isAuthenticated } = useAuthStore()
  const [progressList, setProgressList] = useState<ProgressItem[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})

  // Fetch all progress for current user
  const fetchProgress = useCallback(async (contentType?: string) => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (contentType) params.set('contentType', contentType)
      const res = await fetch(`/api/progress?${params}`)
      if (res.ok) {
        const data = await res.json()
        const items = data.data?.progress || []
        setProgressList(items)
        // Build progress map
        const map: Record<string, number> = {}
        for (const item of items) {
          map[`${item.contentId}_${item.contentType}`] = item.progress
        }
        setProgressMap(map)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [user?.id])

  // Update progress for a content item
  const updateProgress = useCallback(async (contentId: string, contentType: string, progress: number, _contentTitle?: string) => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType, progress }),
      })
      if (res.ok) {
        setProgressMap(prev => ({ ...prev, [`${contentId}_${contentType}`]: progress }))
      }
    } catch { /* ignore */ }
  }, [user?.id])

  // Record recently viewed
  const recordView = useCallback(async (contentId: string, contentType: string, title: string) => {
    if (!user?.id) return
    try {
      await fetch('/api/recently-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType, title }),
      })
    } catch { /* ignore */ }
  }, [user?.id])

  // Fetch recently viewed
  const fetchRecentlyViewed = useCallback(async (contentType?: string, limit?: number) => {
    if (!user?.id) return
    try {
      const params = new URLSearchParams()
      if (contentType) params.set('contentType', contentType)
      if (limit) params.set('limit', String(limit))
      const res = await fetch(`/api/recently-viewed?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRecentlyViewed(data.data?.items || [])
      }
    } catch { /* ignore */ }
  }, [user?.id])

  // Load progress on auth change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProgress()
      fetchRecentlyViewed()
    } else {
      setProgressList([])
      setProgressMap({})
      setRecentlyViewed([])
    }
  }, [isAuthenticated, user?.id, fetchProgress, fetchRecentlyViewed])

  return {
    progressList,
    recentlyViewed,
    loading,
    progressMap,
    fetchProgress,
    updateProgress,
    recordView,
    fetchRecentlyViewed,
    getProgress: (contentId: string, contentType: string) => progressMap[`${contentId}_${contentType}`] || 0,
  }
}
