'use client'

import { fetchJSON } from '@/lib/fetch-json'
import { useAuthUser } from '@/store/auth'
import { useBoardFilterStore } from '@/store/board-filters'
import type { AnalyticsData,BoardQuestionItem,BoardQuestionsResponse,PurchaseStatus } from '@/types/board-questions'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDebounce } from './use-debounce'

interface BoardQuestionsDataResult {
  questions: BoardQuestionItem[]
  analytics: AnalyticsData
  isLoading: boolean
  isFetching: boolean
  error: string | null
  pagination: { page: number; limit: number; total: number; totalPages: number }
  purchaseMap: Record<string, PurchaseStatus>
  refetch: () => void
}

export function useBoardQuestionsData(page: number = 1, limitOverride?: number, typeOverride?: 'mcq' | 'cq'): BoardQuestionsDataResult {
  const filters = useBoardFilterStore()
  const user = useAuthUser()
  const debouncedSearch = useDebounce(filters.searchQuery, 400)

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filters.classLevels.length) params.set('classLevel', filters.classLevels.join(','))
    if (filters.boards.length) params.set('board', filters.boards.join(','))
    if (filters.years.length) params.set('year', filters.years.join(','))
    if (filters.subjects.length) params.set('subjectId', filters.subjects.join(','))
    if (filters.chapters.length) params.set('chapterId', filters.chapters.join(','))
    if (typeOverride) params.set('type', typeOverride)
    else if (filters.questionTypes.length) params.set('type', filters.questionTypes.join(','))
    if (filters.difficulty.length) params.set('difficulty', filters.difficulty.join(','))
    if (filters.topics.length) params.set('topic', filters.topics.join(','))
    if (filters.contentAccess !== 'all') params.set('access', filters.contentAccess)
    params.set('sortBy', filters.sortBy)
    params.set('page', String(page))
    params.set('limit', String(limitOverride ?? 20))
    return params.toString()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    typeOverride,
    filters.classLevels,
    filters.boards,
    filters.years,
    filters.subjects,
    filters.chapters,
    filters.questionTypes,
    filters.difficulty,
    filters.topics,
    filters.contentAccess,
    filters.sortBy,
    page,
    limitOverride,
  ])

  const queryKey = ['board-questions', queryParams, user?.id]

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: (): Promise<BoardQuestionsResponse> =>
      fetchJSON<BoardQuestionsResponse>(`/api/board-questions?${queryParams}`),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const questions = data?.data ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }
  const analytics = data?.analytics ?? {
    totalQuestions: 0,
    accessibleQuestions: 0,
    premiumQuestions: 0,
    unlockedQuestions: 0,
    availableBoards: 0,
    availableSubjects: 0,
    availableChapters: 0,
    questionsPracticed: 0,
    questionsRemaining: 0,
    accuracyRate: 0,
  }

  const purchaseMap: Record<string, PurchaseStatus> = {}

  return {
    questions,
    analytics,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    pagination,
    purchaseMap,
    refetch,
  }
}
