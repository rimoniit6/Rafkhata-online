'use client'

import { useState, useCallback, useMemo } from 'react'

export function useTableSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allVisibleSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  )

  const someVisibleSelected = useMemo(
    () => items.some((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  )

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allOnPage = items.every((item) => next.has(item.id))
      if (allOnPage) {
        items.forEach((item) => next.delete(item.id))
      } else {
        items.forEach((item) => next.add(item.id))
      }
      return next
    })
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  return {
    selectedIds: selectedArray,
    selectedSet: selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleOne,
    toggleAll,
    clearSelection,
    count: selectedIds.size,
  }
}
