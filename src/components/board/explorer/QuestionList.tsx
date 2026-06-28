'use client'

import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { QuestionCard } from './QuestionCard'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface QuestionListProps {
  questions: BoardQuestionItem[]
  accessMap: Record<string, AccessStatus>
  boardColor: string
  expandedId: string | null
  onCardClick: (q: BoardQuestionItem) => void
  onBookmark: (q: BoardQuestionItem) => void
  onShare: (q: BoardQuestionItem) => void
  bookmarkedIds: Set<string>
}

export function QuestionList({
  questions,
  accessMap,
  boardColor,
  expandedId,
  onCardClick,
  onBookmark,
  onShare,
  bookmarkedIds,
}: QuestionListProps) {
  const mcqQuestions = useMemo(() => questions.filter((q) => q.type === 'mcq'), [questions])
  const cqQuestions = useMemo(() => questions.filter((q) => q.type === 'cq'), [questions])

  const hasMcq = mcqQuestions.length > 0
  const hasCq = cqQuestions.length > 0

  if (!hasMcq && !hasCq) return null

  const renderCard = (q: BoardQuestionItem) => {
    const accessStatus = accessMap[q.id]
    const bookmarked = bookmarkedIds.has(q.id)

    return (
      <QuestionCard
        key={q.id}
        question={q}
        accessStatus={accessStatus}
        isBookmarked={bookmarked}
        isExpanded={expandedId === q.id}
        boardColor={boardColor}
        onCardClick={() => onCardClick(q)}
        onBookmark={() => onBookmark(q)}
        onShare={() => onShare(q)}
      />
    )
  }

  if (hasMcq && hasCq) {
    return (
      <Tabs defaultValue="mcq" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="mcq" className="gap-2">
            MCQ
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {mcqQuestions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cq" className="gap-2">
            CQ (সৃজনশীল)
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {cqQuestions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mcq">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {mcqQuestions.map(renderCard)}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="cq">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {cqQuestions.map(renderCard)}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  const displayQuestions = hasMcq ? mcqQuestions : cqQuestions

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {displayQuestions.map(renderCard)}
      </AnimatePresence>
    </div>
  )
}
