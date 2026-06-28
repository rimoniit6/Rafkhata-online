'use client'

import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toBengaliNumerals } from '@/lib/utils'
import { McqViewCard } from './McqViewCard'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface McqViewModeProps {
  questions: BoardQuestionItem[]
  accessMap: Record<string, AccessStatus>
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onPracticeAll: () => void
  onUnlock: (q: BoardQuestionItem) => void
}

export function McqViewMode({
  questions,
  accessMap,
  page,
  totalPages,
  total,
  onPageChange,
  onPracticeAll,
  onUnlock,
}: McqViewModeProps) {
  const accessibleMcqs = questions.filter(
    (q) => accessMap[q.id]?.accessType === 'free' || accessMap[q.id]?.accessType === 'purchased',
  )

  return (
    <div className="space-y-4">
      {/* Practice All Banner */}
      {accessibleMcqs.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in-up">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {toBengaliNumerals(accessibleMcqs.length)} MCQ{accessibleMcqs.length > 1 ? 's' : ''} on this page
            </p>
            <p className="text-xs text-muted-foreground">Practice questions shown on this page</p>
          </div>
          <Button
            size="sm"
            onClick={onPracticeAll}
            className="gap-1.5 shrink-0 rounded-lg"
          >
            <Play className="h-3.5 w-3.5" />
            Practice All
          </Button>
        </div>
      )}

      {/* Question Cards */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <McqViewCard
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
