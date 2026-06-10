'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/hooks/use-toast'

interface BookmarkItem {
  id: string
  contentId: string
  contentType: string
  contentTitle: string
  createdAt: string
}

export function useBookmarks() {
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [bookmarkMap, setBookmarkMap] = useState<Record<string, boolean>>({})

  // Fetch all bookmarks for current user
  const fetchBookmarks = useCallback(async (contentType?: string) => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (contentType) params.set('contentType', contentType)
      const res = await fetch(`/api/bookmarks?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookmarks(data.data?.bookmarks || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [user?.id])

  // Check if specific content is bookmarked
  const checkBookmarked = useCallback(async (contentId: string, contentType: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/bookmarks/check?contentId=${contentId}&contentType=${contentType}`)
      if (res.ok) {
        const data = await res.json()
        return data.data?.isBookmarked || false
      }
    } catch { /* ignore */ }
    return false
  }, [])

  // Batch check bookmarked status
  const batchCheckBookmarked = useCallback(async (items: { contentId: string; contentType: string }[]) => {
    if (!user?.id || items.length === 0) return
    try {
      const res = await fetch('/api/bookmarks/batch-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, boolean> = {}
        for (const item of (data.data?.items || [])) {
          map[`${item.contentId}_${item.contentType}`] = item.isBookmarked
        }
        setBookmarkMap(prev => ({ ...prev, ...map }))
      }
    } catch { /* ignore */ }
  }, [user?.id])

  // Toggle bookmark
  const toggleBookmark = useCallback(async (contentId: string, contentType: string, contentTitle?: string) => {
    if (!user?.id) {
      toast({ title: 'লগইন প্রয়োজন', description: 'বুকমার্ক করতে লগইন করুন', variant: 'destructive' })
      return false
    }
    const key = `${contentId}_${contentType}`
    const isCurrentlyBookmarked = bookmarkMap[key]

    try {
      const res = await fetch('/api/bookmarks', {
        method: isCurrentlyBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType }),
      })
      if (res.ok) {
        const newBookmarked = !isCurrentlyBookmarked
        setBookmarkMap(prev => ({ ...prev, [key]: newBookmarked }))
        toast({
          title: newBookmarked ? 'বুকমার্ক যোগ হয়েছে' : 'বুকমার্ক সরানো হয়েছে',
          description: newBookmarked
            ? `${contentTitle || 'কন্টেন্ট'} সেভ করা হয়েছে`
            : `${contentTitle || 'কন্টেন্ট'} সেভ থেকে সরানো হয়েছে`,
        })
        return newBookmarked
      }
    } catch { /* ignore */ }
    return isCurrentlyBookmarked || false
  }, [user?.id, bookmarkMap, toast])

  // Load bookmarks on auth change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBookmarks()
    } else {
      setBookmarks([])
      setBookmarkMap({})
    }
  }, [isAuthenticated, user?.id, fetchBookmarks])

  return {
    bookmarks,
    loading,
    bookmarkMap,
    fetchBookmarks,
    checkBookmarked,
    batchCheckBookmarked,
    toggleBookmark,
    isBookmarked: (contentId: string, contentType: string) => bookmarkMap[`${contentId}_${contentType}`] || false,
  }
}
