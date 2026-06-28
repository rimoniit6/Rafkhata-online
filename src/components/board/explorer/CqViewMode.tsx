'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toBengaliNumerals } from '@/lib/utils'
import { CqViewCard } from './CqViewCard'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface CqViewModeProps {
  questions: BoardQuestionItem[]
  accessMap: Record<string, AccessStatus>
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onUnlock: (q: BoardQuestionItem) => void
}

export function CqViewMode({
  questions,
  accessMap,
  page,
  totalPages,
  total,
  onPageChange,
  onUnlock,
}: CqViewModeProps) {
  return (
    <div className="space-y-4">
      {/* Question Cards */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <CqViewCard
            key={q.id}
            question={q}
            index={i}
            accessStatus={accessMap[q.id]}
            onUnlock={() => onUnlock(q)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-1">
            {(() => {
              const maxVisible = 7
              const pages: (number | 'ellipsis')[] = []

              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                let start = Math.max(2, page - 1)
                let end = Math.min(totalPages - 1, page + 1)
                if (page <= 3) { start = 2; end = Math.min(maxVisible - 1, totalPages - 1) }
                if (page >= totalPages - 2) { start = Math.max(2, totalPages - maxVisible + 2); end = totalPages - 1 }

                if (start > 2) pages.push('ellipsis')
                for (let i = start; i <= end; i++) pages.push(i)
                if (end < totalPages - 1) pages.push('ellipsis')
                pages.push(totalPages)
              }

              return pages.map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    className="h-9 w-9 rounded-lg text-xs font-medium"
                  >
                    {toBengaliNumerals(p)}
                  </Button>
                ),
              )
            })()}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {totalPages > 0 && (
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground">
            Showing {questions.length} of {toBengaliNumerals(total)} questions
            {totalPages > 1 && ` · Page ${toBengaliNumerals(page)} of ${toBengaliNumerals(totalPages)}`}
          </p>
        </div>
      )}
    </div>
  )
}
