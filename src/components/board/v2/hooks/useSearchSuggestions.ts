'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useBoardFilterStore } from '@/store/board-filters'
import { loadRecentSearches, saveRecentSearch, removeRecentSearch } from '../utils/search-storage'
import { BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SearchSuggestion {
  text: string
  type: 'question'
  icon: LucideIcon
}

const POPULAR_SUGGESTIONS: SearchSuggestion[] = [
  { text: 'Rajshahi Board 2024 Mathematics', type: 'question', icon: BookOpen },
  { text: 'Dhaka Board 2023 Physics', type: 'question', icon: BookOpen },
  { text: 'SSC Board Questions', type: 'question', icon: BookOpen },
  { text: 'HSC 2024 All Boards', type: 'question', icon: BookOpen },
  { text: 'Chapter 5: Chemical Bonding', type: 'question', icon: BookOpen },
]

export function useSearchSuggestions() {
  const { searchQuery, setSearchQuery } = useBoardFilterStore()
  const [focused, setFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches())
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const commitSearch = useCallback((q: string) => {
    setSearchQuery(q)
    setRecentSearches((prev) => saveRecentSearch(prev, q))
    setFocused(false)
  }, [setSearchQuery])

  const handleClear = useCallback(() => {
    setSearchQuery('')
    inputRef.current?.focus()
  }, [setSearchQuery])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setRecentSearches((prev) => saveRecentSearch(prev, searchQuery))
    }
  }, [searchQuery])

  const handleRemoveRecent = useCallback((text: string) => {
    setRecentSearches((prev) => removeRecentSearch(prev, text))
  }, [])

  const filteredPopular = searchQuery
    ? POPULAR_SUGGESTIONS.filter((s) =>
        s.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : POPULAR_SUGGESTIONS

  const showSuggestions = focused && !searchQuery
  const showSearchResults = focused && searchQuery

  return {
    searchQuery,
    setSearchQuery,
    focused,
    setFocused,
    recentSearches,
    inputRef,
    containerRef,
    popularSuggestions: POPULAR_SUGGESTIONS,
    filteredPopular,
    showSuggestions,
    showSearchResults,
    commitSearch,
    handleClear,
    handleSubmit,
    handleRemoveRecent,
  }
}
