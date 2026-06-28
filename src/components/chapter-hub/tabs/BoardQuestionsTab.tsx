'use client'

import { useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChapterBoardQuestions } from '@/hooks/use-chapter-content'
import { useAccessStatus } from '@/hooks/use-access-status'
import { BoardQuestionCard } from '../cards/BoardQuestionCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { groupBoardItems, formatBoardsYears } from '@/lib/board-grouping'
import type { BoardQuestionItem } from '@/types/board-questions'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10

interface BoardQuestionsTabProps {
  chapterId: string
}

export function BoardQuestionsTab({ chapterId }: BoardQuestionsTabProps) {
  const [page, setPage] = useState(1)
  const [subTab, setSubTab] = useState('all')
  const { data: questions, isLoading, error } = useChapterBoardQuestions(chapterId, 1, 500)
  const classSlug = useRouterStore((s) => s.params.classSlug)
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  const boardItemsRaw = (questions ?? []) as BoardQuestionItem[]
  const accessMap = useAccessStatus(boardItemsRaw)

  const groupedItems = useMemo(() => {
    if (!questions) return []
    const raw = questions as BoardQuestionItem[]

    if (subTab === 'all') {
      const mcqs = groupBoardItems(raw, 'mcq', accessMap)
      const cqs = groupBoardItems(raw, 'cq', accessMap)
      return [...mcqs, ...cqs]
    }

    return groupBoardItems(raw, subTab as 'mcq' | 'cq', accessMap)
  }, [questions, subTab, accessMap])

  const itemsWithLabels = useMemo(() => {
    return groupedItems.map((g) => {
      const { label, sublabel } = formatBoardsYears(g.boards, g.years, g.occurrences)
      return { ...g, boards: g.boards, years: g.years, boardLabel: label, yearLabel: sublabel }
    })
  }, [groupedItems])

  const totalPages = Math.ceil(itemsWithLabels.length / PAGE_SIZE)
  const paginatedItems = useMemo(
    () => itemsWithLabels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [itemsWithLabels, page],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || itemsWithLabels.length === 0) {
    return <ChapterEmptyState tab="board" />
  }

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="all" className="text-xs rounded-md">All</TabsTrigger>
          <TabsTrigger value="mcq" className="text-xs rounded-md">Board MCQ</TabsTrigger>
          <TabsTrigger value="cq" className="text-xs rounded-md">Board CQ</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        {itemsWithLabels.length} board question{itemsWithLabels.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {paginatedItems.map((q, i) => (
          <BoardQuestionCard
            key={q.id}
            question={q as any}
            index={i}
            onUnlock={() => setUnlockTarget({
              contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
              contentId: q.id,
              contentTitle: q.question.replace(/<[^>]*>/g, '').slice(0, 80),
              contentPrice: q.price,
            })}
          />
        ))}
      </div>
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
