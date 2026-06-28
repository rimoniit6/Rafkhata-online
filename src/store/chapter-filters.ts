'use client'

import { create } from 'zustand'

export interface ChapterFilterState {
  searchQuery: string
  access: 'all' | 'free' | 'purchased' | 'locked'
  difficulty: string[]
  board: string[]
  year: string[]
  topic: string[]
  activeTab: string
  setFilter: <K extends keyof ChapterFilterState>(key: K, value: ChapterFilterState[K]) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
  activeFilterCount: () => number
}

const initialFilters = {
  searchQuery: '',
  access: 'all' as const,
  difficulty: [] as string[],
  board: [] as string[],
  year: [] as string[],
  topic: [] as string[],
}

export const useChapterFilterStore = create<ChapterFilterState>((set, get) => ({
  ...initialFilters,
  activeTab: 'all',

  setFilter: (key, value) => set({ [key]: value }),

  clearFilters: () => set({ ...initialFilters }),

  hasActiveFilters: () => {
    const s = get()
    return (
      s.access !== 'all' ||
      s.difficulty.length > 0 ||
      s.board.length > 0 ||
      s.year.length > 0 ||
      s.topic.length > 0
    )
  },

  activeFilterCount: () => {
    const s = get()
    let count = 0
    if (s.access !== 'all') count++
    if (s.difficulty.length > 0) count++
    if (s.board.length > 0) count++
    if (s.year.length > 0) count++
    if (s.topic.length > 0) count++
    return count
  },
}))
