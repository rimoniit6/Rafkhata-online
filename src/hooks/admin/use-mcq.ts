'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { mcqService, type MCQListParams, type MCQRecord } from '@/services/api/mcq.service'
import { queryKeys } from '@/lib/query-keys'

export function useMcqs(params: MCQListParams = {}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.mcq(params),
    queryFn: () => mcqService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.mcq() })
  }, [qc])

  const refetch = query.refetch

  return {
    mcqs: (query.data?.data ?? []) as MCQRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  }
}
