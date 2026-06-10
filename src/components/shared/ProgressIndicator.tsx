'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/auth'
import { cn, toBengaliNumerals } from '@/lib/utils'

interface ProgressIndicatorProps {
  contentId: string
  contentType: 'lecture' | 'mcq' | 'cq'
  initialProgress?: number
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export default function ProgressIndicator({
  contentId,
  contentType,
  initialProgress,
  showLabel = true,
  className,
  size = 'sm',
}: ProgressIndicatorProps) {
  const { user } = useAuthStore()
  const [fetchedProgress, setFetchedProgress] = useState<number | null>(null)

  // Use initialProgress if provided, otherwise use fetched value, fallback to 0
  const progress = initialProgress !== undefined ? initialProgress : (fetchedProgress ?? 0)

  useEffect(() => {
    if (initialProgress !== undefined) return
    if (!user?.id) return

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?contentId=${contentId}&contentType=${contentType}`)
        if (res.ok) {
          const data = await res.json()
          const items = data.data?.progress || []
          if (items.length > 0) {
            setFetchedProgress(items[0].progress)
          }
        }
      } catch { /* ignore */ }
    }
    fetchProgress()
  }, [contentId, contentType, user?.id, initialProgress])

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className={cn(size === 'sm' ? 'text-xs' : 'text-sm', 'text-muted-foreground')}>
            অগ্রগতি
          </span>
          <span className={cn(size === 'sm' ? 'text-xs' : 'text-sm', 'font-medium')}>
            {toBengaliNumerals(Math.round(progress))}%
          </span>
        </div>
      )}
      <Progress
        value={progress}
        className={size === 'sm' ? 'h-1.5' : 'h-2.5'}
      />
    </div>
  )
}
