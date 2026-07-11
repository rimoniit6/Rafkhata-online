'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { suggestionService, type SuggestionListResponse } from '@/services/api/suggestion.service'
import { queryKeys } from '@/lib/query-keys'

export function useSuggestions(params?: Record<string, unknown>) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.suggestions(params),
    queryFn: () => suggestionService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.suggestions(params) })
  }, [qc, params])

  return {
    data: (query.data ?? null) as SuggestionListResponse | null,
    suggestions: ((query.data as SuggestionListResponse | undefined)?.suggestions ?? []) as SuggestionListResponse['suggestions'],
    total: (query.data as SuggestionListResponse | undefined)?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
