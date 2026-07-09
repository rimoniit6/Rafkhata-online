'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useChapterKnowledge, type KnowledgeItem } from '@/hooks/use-chapter-content'
import { KnowledgeCard } from '../cards/KnowledgeCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'

interface KnowledgeQuestionsTabProps {
  chapterId: string
}

export function KnowledgeQuestionsTab({ chapterId }: KnowledgeQuestionsTabProps) {
  const { data: items, isLoading, error } = useChapterKnowledge(chapterId)
  const classSlug = useRouterStore((s) => s.params.classSlug)
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

  if (error || !items || items.length === 0) {
    return <ChapterEmptyState tab="knowledge" />
  }

  return (
    <div className="space-y-4">
      {(items as KnowledgeItem[]).map((item, i) => (
        <KnowledgeCard key={item.id} item={item} index={i} onUnlock={() => setUnlockTarget({
          contentType: 'knowledge',
          contentId: item.id,
          contentTitle: item.question.replace(/<[^>]*>/g, '').slice(0, 80),
          contentPrice: item.price,
        })} />
      ))}
      {unlockTarget && (
        <PurchaseOptionsModal
          open
          onOpenChange={(open) => { if (!open) setUnlockTarget(null) }}
          {...unlockTarget}
          classLevel={classSlug}
        />
      )}
    </div>
  )
}
