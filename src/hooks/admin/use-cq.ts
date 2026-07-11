'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cqService, type CQListParams, type CQRecord } from '@/services/api/cq.service'
import { queryKeys } from '@/lib/query-keys'

export function useCqs(params: CQListParams = {}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.cq(params),
    queryFn: () => cqService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.cq() })
  }, [qc])

  return {
    cqs: (query.data?.data ?? []) as CQRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
