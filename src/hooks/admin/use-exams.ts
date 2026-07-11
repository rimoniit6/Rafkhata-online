'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { examService, type ExamListParams, type ExamRecord } from '@/services/api/exam.service'
import { queryKeys } from '@/lib/query-keys'

export function useExams(params: ExamListParams = {}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.exams(params),
    queryFn: () => examService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.exams() })
  }, [qc])

  return {
    exams: (query.data?.data ?? []) as ExamRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
