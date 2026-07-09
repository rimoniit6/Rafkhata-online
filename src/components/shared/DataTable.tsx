'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  render: (item: T) => React.ReactNode
  cellClass?: string
  headerClass?: string
}

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  handler: (selectedIds: string[]) => Promise<void>
  requiresSelection?: boolean
}

export interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[]
  data: T[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  loading?: boolean
  selectable?: boolean
  selectedIds?: string[]
  onToggleOne?: (id: string) => void
  onToggleAll?: () => void
  allVisibleSelected?: boolean
  someVisibleSelected?: boolean
  bulkActions?: BulkAction[]
  sortField?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string) => void
  emptyMessage?: string
  filters?: React.ReactNode
  keyExtractor?: (item: T) => string
}

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

// ─── Sub-components ─────────────────────────────────────────────

const SortIndicator = React.memo(function SortIndicator({
  field,
  sortField,
  sortDirection,
}: {
  field: string
  sortField?: string | null
  sortDirection?: 'asc' | 'desc'
}) {
  if (sortField !== field) {
    return <ArrowUp className="ml-1 inline size-3 opacity-30" aria-hidden="true" />
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="ml-1 inline size-3" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 inline size-3" aria-hidden="true" />
  )
})

SortIndicator.displayName = 'SortIndicator'

const DataTablePagination = React.memo(function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between" role="navigation" aria-label="পৃষ্ঠার নেভিগেশন">
      <p className="text-sm text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="প্রতি পাতায় আইটেম সংখ্যা"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / পাতা
              </option>
            ))}
          </select>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="পূর্ববর্তী পৃষ্ঠা"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="পরবর্তী পৃষ্ঠা"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

DataTablePagination.displayName = 'DataTablePagination'

// ─── Main component ─────────────────────────────────────────────

function DataTableInner<T extends { id: string }>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  selectable,
  selectedIds = [],
  onToggleOne,
  onToggleAll,
  allVisibleSelected,
  someVisibleSelected,
  bulkActions,
  sortField,
  sortDirection,
  onSort,
  emptyMessage = 'কোনো তথ্য পাওয়া যায়নি',
  filters,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize)
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds])

  const colCount = columns.length + (selectable ? 1 : 0)

  const sortAriaSort = (col: ColumnDef<T>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!col.sortable) return undefined
    if (sortField !== col.key) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="space-y-4">
      {filters && <div>{filters}</div>}

      {selectable && selectedIds.length > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-2 bg-muted/50 rounded-lg border" role="toolbar" aria-label="গণ কার্যক্রম">
          <span className="text-sm text-muted-foreground mr-2">
            {selectedIds.length}টি নির্বাচিত
          </span>
          {bulkActions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => action.handler(selectedIds)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-lg border">
        <Table role="table" aria-label="ডাটা টেবিল">
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected && data.length > 0}
                    data-state={someVisibleSelected && !allVisibleSelected ? 'indeterminate' : undefined}
                    onCheckedChange={onToggleAll}
                    aria-label="সব নির্বাচন"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.headerClass
                  )}
                  aria-sort={sortAriaSort(col)}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <span className="flex items-center">
                    {col.header}
                    {col.sortable && onSort && (
                      <SortIndicator field={col.key} sortField={sortField} sortDirection={sortDirection} />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} aria-hidden="true">
                    {selectable && (
                      <TableCell>
                        <Skeleton className="size-4" />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={colCount}
                        className="text-center py-12 text-muted-foreground"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )
                : (
                    data.map((item) => {
                      const isSelected = selectedSet.has(item.id)
                      return (
                        <TableRow
                          key={item.id}
                          data-state={isSelected ? 'selected' : undefined}
                          className={cn(isSelected && 'bg-muted/50')}
                        >
                          {selectable && (
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleOne?.(item.id)}
                                aria-label="নির্বাচন"
                              />
                            </TableCell>
                          )}
                          {columns.map((col) => (
                            <TableCell key={col.key} className={col.cellClass}>
                              {col.render(item)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

const DataTable = Object.assign(
  React.memo(DataTableInner) as typeof DataTableInner,
  { displayName: 'DataTable' }
)

export default DataTable
