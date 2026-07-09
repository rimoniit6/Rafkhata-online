'use client'

import { useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useChapterLectures, type LectureItem } from '@/hooks/use-chapter-content'
import { LectureCard } from '../cards/LectureCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10

interface LecturesTabProps {
  chapterId: string
}

export function LecturesTab({ chapterId }: LecturesTabProps) {
  const [page, setPage] = useState(1)
  const { data: lectures, isLoading, error } = useChapterLectures(chapterId, 1, 500)
  const navigate = useRouterStore((s) => s.navigate)
  const classSlug = useRouterStore((s) => s.params.classSlug)
  const subjectId = useRouterStore((s) => s.params.subjectId)
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  const allItems = useMemo(() => (lectures as LectureItem[]) || [], [lectures])
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

  if (error || allItems.length === 0) {
    return <ChapterEmptyState tab="lecture" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {allItems.length} Lecture{allItems.length !== 1 ? 's' : ''}
      </p>
      {paginatedItems.map((lecture, i) => (
        <LectureCard
          key={lecture.id}
          lecture={lecture}
          index={i}
          isLocked={lecture.isPremium}
          onUnlock={() => setUnlockTarget({
            contentType: 'lecture',
            contentId: lecture.id,
            contentTitle: lecture.title.slice(0, 80),
            contentPrice: lecture.price,
          })}
          onContinue={() => navigate('lecture-viewer', { lectureId: lecture.id, chapterId, subjectId, classSlug })}
        />
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
