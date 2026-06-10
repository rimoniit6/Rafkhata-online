'use client'

import { useState, useEffect } from 'react'
import { useHierarchyMetadata } from './use-hierarchy-metadata'

interface BoardYearItem {
  id: string
  board: string
  year: string
  isActive: boolean
}

export function useBoardYears() {
  const { boardSlugToLabel } = useHierarchyMetadata()
  const [boardYears, setBoardYears] = useState<BoardYearItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/board-years')
      .then(r => r.json())
      .then(j => setBoardYears(Array.isArray(j.data) ? j.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Unique boards from the BoardYear data
  const boardOptions = Array.from(
    new Set(boardYears.filter(by => by.isActive).map(by => by.board))
  ).map(board => ({
    value: board,
    label: boardSlugToLabel[board] || board,
  }))

  // Unique years from the BoardYear data
  const yearOptions = Array.from(
    new Set(boardYears.filter(by => by.isActive).map(by => by.year))
  )
    .sort((a, b) => Number(b) - Number(a))
    .map(year => ({
      value: year,
      label: year, // Will be displayed as-is (e.g. "2024")
    }))

  // Map board slug to Bengali label
  const boardSlugToLabelFn = (slug: string) => boardSlugToLabel[slug] || slug

  return {
    boardYears,
    boardOptions,
    yearOptions,
    boardSlugToLabel: boardSlugToLabelFn,
    loading,
  }
}
