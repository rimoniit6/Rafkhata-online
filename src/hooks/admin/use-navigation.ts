'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { navigationService, type NavigationRecord } from '@/services/api/navigation.service'
import { queryKeys } from '@/lib/query-keys'

export function useNavigation() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.navigation(),
    queryFn: () => navigationService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.navigation() })
  }, [qc])

  return {
    navigation: (query.data ?? []) as NavigationRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
