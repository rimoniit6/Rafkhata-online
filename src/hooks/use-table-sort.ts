'use client'

import { useState, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  field: string | null
  direction: SortDirection
}

export function useTableSort(initialField?: string, initialDirection?: SortDirection) {
  const [sort, setSort] = useState<SortState>({
    field: initialField ?? null,
    direction: initialDirection ?? 'desc',
  })

  const toggleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (prev.field === field) {
        const nextDir = prev.direction === 'asc' ? 'desc' : 'asc'
        return { field, direction: nextDir }
      }
      return { field, direction: 'desc' }
    })
  }, [])

  const resetSort = useCallback(() => {
    setSort({ field: null, direction: 'desc' })
  }, [])

  return {
    sortField: sort.field,
    sortDirection: sort.direction,
    toggleSort,
    resetSort,
  }
}
