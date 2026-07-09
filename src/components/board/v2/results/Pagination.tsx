'use client'

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toBengaliNumerals } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { computePaginationWindow } from '../utils/pagination'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const isMobile = useIsMobile()

  if (totalPages <= 1) return null

  if (isMobile) {
    const hasMore = page < totalPages
    const loadedSoFar = Math.min(page * pageSize, total)

    return (
      <div className="space-y-3 py-4">
        {hasMore && (
          <Button
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            className="w-full h-12 rounded-xl gap-2 text-sm font-medium border-border/50"
          >
            <ChevronDown className="h-4 w-4" />
            Load More
          </Button>
        )}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Showing {toBengaliNumerals(loadedSoFar)} of {toBengaliNumerals(total)} questions
          </p>
        </div>
      </div>
    )
  }

  const window = computePaginationWindow(page, totalPages)

  return (
    <div className="space-y-4">
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
          {window.items.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={'ellipsis-' + i} className="text-xs text-muted-foreground px-1">...</span>
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
          )}
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

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">
          Showing {pageSize} of {toBengaliNumerals(total)} questions
          {totalPages > 1 && ' · Page ' + toBengaliNumerals(page) + ' of ' + toBengaliNumerals(totalPages)}
        </p>
      </div>
    </div>
  )
}
