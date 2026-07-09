'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useChapterMCQs } from '@/hooks/use-chapter-content'
import { McqCard, type McqItem } from '../cards/McqCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'

interface McqTabProps {
  chapterId: string
}

const PAGE_SIZE = 20

export function McqTab({ chapterId }: McqTabProps) {
  const [page, setPage] = useState(1)
  const { data: rawItems, isLoading, error } = useChapterMCQs(chapterId, 1, 500)
  const classSlug = useRouterStore((s) => s.params.classSlug)
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  const items = useMemo(() => (rawItems ?? []) as unknown as McqItem[], [rawItems])
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || items.length === 0) {
    return <ChapterEmptyState tab="mcq" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {items.length} MCQ{items.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {paginatedItems.map((item) => (
            <McqCard
              key={item.id}
              item={item}
              onUnlock={() => setUnlockTarget({
                contentType: 'mcq',
                contentId: item.id,
                contentTitle: item.text.replace(/<[^>]*>/g, '').slice(0, 80),
                contentPrice: item.price,
              })}
            />
          ))}
        </AnimatePresence>
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
