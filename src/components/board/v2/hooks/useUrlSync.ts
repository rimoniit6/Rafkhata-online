'use client'

import { useEffect, useRef } from 'react'
import { useBoardFilterStore } from '@/store/board-filters'
import type { BoardQuestionFilters } from '@/types/board-questions'

const FILTER_KEYS: (keyof BoardQuestionFilters)[] = [
  'searchQuery',
  'classLevels',
  'boards',
  'years',
  'subjects',
  'chapters',
  'questionTypes',
  'difficulty',
  'topics',
  'status',
  'contentAccess',
  'sortBy',
]

function parseUrlParams(): Partial<BoardQuestionFilters> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const filters: Partial<BoardQuestionFilters> = {}

  for (const key of FILTER_KEYS) {
    const value = params.get(key)
    if (value === null) continue

    const initial = useBoardFilterStore.getInitialState()
    const initialVal = initial[key]

    if (Array.isArray(initialVal)) {
      filters[key] = value.split(',').filter(Boolean) as never
    } else if (typeof initialVal === 'string') {
      filters[key] = value as never
    }
  }

  return filters
}

function filtersToParams(): URLSearchParams {
  const state = useBoardFilterStore.getState()
  const params = new URLSearchParams()

  for (const key of FILTER_KEYS) {
    const value = state[key]
    const initial = useBoardFilterStore.getInitialState()[key]

    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(','))
    } else if (typeof value === 'string' && value !== initial && value) {
      params.set(key, value)
    }
  }

  return params
}

export function useUrlSync(enabled: boolean = false) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (initialized.current) return
    initialized.current = true

    const urlFilters = parseUrlParams()
    if (Object.keys(urlFilters).length > 0) {
      const store = useBoardFilterStore.getState()
      for (const [key, value] of Object.entries(urlFilters)) {
        store.setFilter(key as keyof BoardQuestionFilters, value as string | string[])
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = useBoardFilterStore.subscribe(() => {
      const params = filtersToParams()
      const qs = params.toString()
      const newUrl = qs ? window.location.pathname + '?' + qs : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    })

    return unsubscribe
  }, [enabled])
}
