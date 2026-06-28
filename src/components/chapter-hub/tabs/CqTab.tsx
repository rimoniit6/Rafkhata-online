'use client'

import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { useChapterCQs, useChapterBoardQuestions } from '@/hooks/use-chapter-content'
import type { CQListItem } from '@/hooks/use-chapter-content'
import type { BoardQuestionItem } from '@/types/board-questions'
import { useAccessStatus } from '@/hooks/use-access-status'
import { useRouterStore } from '@/store/router'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CqCard } from '../cards/CqCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import { groupBoardItems, formatBoardsYears } from '@/lib/board-grouping'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'

interface CqTabProps {
  chapterId: string
}

function chapterCqToCard(c: any): CQListItem & { questions?: { id: string; label: string; text: string; answer: string; marks: number }[] } {
  return {
    id: c.id,
    uddeepok: c.uddeepok ?? '',
    uddeepokImage: c.uddeepokImage || null,
    questionCount: c.questionCount || c.questions?.length || (c.uddeepok ? 4 : 0),
    isPremium: c.isPremium || false,
    price: c.price || 0,
    difficulty: c.difficulty || 'medium',
    board: c.board || null,
    year: c.year || null,
    chapterId: c.chapterId || '',
    chapterName: c.chapterName || '',
    subjectName: c.subjectName || '',
    subjectId: c.subjectId || '',
    questions: c.questions || [],
  }
}

const PAGE_SIZE = 10

export function CqTab({ chapterId }: CqTabProps) {
  const [page, setPage] = useState(1)
  const { data: cqs, isLoading: cqLoading, error: cqError } = useChapterCQs(chapterId, 1, 500)
  const { data: boardCqs, isLoading: boardLoading } = useChapterBoardQuestions(chapterId, 1, 500)
  const classSlug = useRouterStore((s) => s.params.classSlug)
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  const isLoading = cqLoading || boardLoading
  const boardItemsRaw = (boardCqs ?? []) as BoardQuestionItem[]
  const accessMap = useAccessStatus(boardItemsRaw)

  const chapterItems = useMemo(() => {
    if (!cqs) return []
    return (cqs as any[])
      .filter((c: any) => !c.board && !c.year)
      .map(chapterCqToCard)
  }, [cqs])

  const groupedBoardItems = useMemo(() => {
    if (!boardCqs) return []
    return groupBoardItems(boardItemsRaw, 'cq', accessMap)
  }, [boardCqs, accessMap])

  const boardItems = useMemo(() => {
    return groupedBoardItems.map((g) => {
      const subQuestions = [
        { id: '1', label: 'ক', text: g.question1 || '', answer: g.answer1 || '', marks: 0 },
        { id: '2', label: 'খ', text: g.question2 || '', answer: g.answer2 || '', marks: 0 },
        { id: '3', label: 'গ', text: g.question3 || '', answer: g.answer3 || '', marks: 0 },
        { id: '4', label: 'ঘ', text: g.question4 || '', answer: g.answer4 || '', marks: 0 },
      ].filter((q) => q.text)

      const { label, sublabel } = formatBoardsYears(g.boards, g.years, g.occurrences)

      return {
        id: 'board-' + g.id,
        uddeepok: g.question,
        uddeepokImage: (g as any).questionImage || null,
        questionCount: subQuestions.length,
        isPremium: g.isPremium,
        price: g.price,
        difficulty: g.difficulty || 'medium',
        board: g.boards[0] || null,
        year: g.years[0] || null,
        chapterId: '',
        chapterName: g.chapterName || '',
        subjectName: g.subjectName || '',
        subjectId: '',
        questions: subQuestions,
        boards: g.boards,
        years: g.years,
        boardLabel: label,
        yearLabel: sublabel,
      }
    })
  }, [groupedBoardItems])

  const allItems = useMemo(() => [...chapterItems, ...boardItems], [chapterItems, boardItems])
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE)
  const paginatedItems = useMemo(
    () => allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allItems, page],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (allItems.length === 0) {
    return <ChapterEmptyState tab="cq" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {allItems.length} CQ{allItems.length !== 1 ? 's' : ''}
        {boardItems.length > 0 && <> &middot; {boardItems.length} board question{boardItems.length !== 1 ? 's' : ''}</>}
      </p>
      {paginatedItems.map((cq, i) => (
        <div key={cq.id} className="flex items-start gap-3">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-6">
            {(page - 1) * PAGE_SIZE + i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <CqCard cq={cq} index={i}
              onUnlock={() => setUnlockTarget({
                contentType: 'cq',
                contentId: cq.id.replace(/^board-/, ''),
                contentTitle: (cq.uddeepok ?? '').replace(/<[^>]*>/g, '').slice(0, 80),
                contentPrice: cq.price,
              })} />
          </div>
        </div>
      ))}
      {unlockTarget && (
        <PurchaseOptionsModal
          open
          onOpenChange={(open) => { if (!open) setUnlockTarget(null) }}
          {...unlockTarget}
          classLevel={classSlug}
        />
      )}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
