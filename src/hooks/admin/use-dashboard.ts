'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardService } from '@/services/api/dashboard.service'
import { queryKeys } from '@/lib/query-keys'

export function useDashboardStats() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => dashboardService.getStats(),
    staleTime: 60_000,
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.stats() })
  }, [qc])

  return {
    stats: query.data?.stats ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
