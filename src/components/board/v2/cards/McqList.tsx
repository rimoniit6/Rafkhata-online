'use client'

import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { McqCard } from './McqCard'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface McqListProps {
  questions: BoardQuestionItem[]
  accessMap: Record<string, AccessStatus>
  boardColor: string
  onBookmark: (q: BoardQuestionItem) => void
  onShare: (q: BoardQuestionItem) => void
  onUnlock: (q: BoardQuestionItem) => void
  bookmarkedIds: Set<string>
}

export function McqList({ questions, accessMap, boardColor, onBookmark, onShare, onUnlock, bookmarkedIds }: McqListProps) {
  const mcqQuestions = useMemo(() => questions.filter((q) => q.type === 'mcq'), [questions])
  if (mcqQuestions.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {mcqQuestions.map((q) => (
          <McqCard key={q.id} question={q} accessStatus={accessMap[q.id]} isBookmarked={bookmarkedIds.has(q.id)}
            boardColor={boardColor}
            onBookmark={() => onBookmark(q)} onShare={() => onShare(q)} onUnlock={() => onUnlock(q)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
