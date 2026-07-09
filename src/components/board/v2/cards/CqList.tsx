'use client'

import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CqCard } from './CqCard'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface CqListProps {
  questions: BoardQuestionItem[]
  accessMap: Record<string, AccessStatus>
  boardColor: string
  onBookmark: (q: BoardQuestionItem) => void
  onShare: (q: BoardQuestionItem) => void
  onUnlock: (q: BoardQuestionItem) => void
  bookmarkedIds: Set<string>
}

export function CqList({ questions, accessMap, boardColor, onBookmark, onShare, onUnlock, bookmarkedIds }: CqListProps) {
  const cqQuestions = useMemo(() => questions.filter((q) => q.type === 'cq'), [questions])
  if (cqQuestions.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {cqQuestions.map((q) => (
          <CqCard key={q.id} question={q} accessStatus={accessMap[q.id]} isBookmarked={bookmarkedIds.has(q.id)}
            boardColor={boardColor}
            onBookmark={() => onBookmark(q)} onShare={() => onShare(q)} onUnlock={() => onUnlock(q)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
