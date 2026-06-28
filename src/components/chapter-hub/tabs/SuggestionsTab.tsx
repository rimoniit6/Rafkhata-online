'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useChapterSuggestions, type SuggestionItem } from '@/hooks/use-chapter-content'
import { SuggestionCard } from '../cards/SuggestionCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { useRouterStore } from '@/store/router'

interface SuggestionsTabProps {
  chapterId: string
}

export function SuggestionsTab({ chapterId }: SuggestionsTabProps) {
  const { data: suggestions, isLoading, error } = useChapterSuggestions(chapterId)
  const { navigate } = useRouterStore()
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !suggestions || suggestions.length === 0) {
    return <ChapterEmptyState tab="suggestion" />
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(suggestions as SuggestionItem[]).map((s, i) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            index={i}
            onView={() => navigate('suggestion-detail', { suggestionId: s.id })}
            onUnlock={() => setUnlockTarget({
              contentType: 'suggestion',
              contentId: s.id,
              contentTitle: s.title.replace(/<[^>]*>/g, '').slice(0, 80),
              contentPrice: s.price ?? 0,
            })}
          />
        ))}
      </div>
      {unlockTarget && (
        <PurchaseOptionsModal
          open={!!unlockTarget}
          onOpenChange={(open) => { if (!open) setUnlockTarget(null) }}
          contentType={unlockTarget.contentType}
          contentId={unlockTarget.contentId}
          contentTitle={unlockTarget.contentTitle}
          contentPrice={unlockTarget.contentPrice}
        />
      )}
    </>
  )
}
