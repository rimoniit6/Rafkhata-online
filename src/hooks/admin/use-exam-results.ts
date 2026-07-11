'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { examResultService, type ExamResultRecord } from '@/services/api/exam-result.service'
import { queryKeys } from '@/lib/query-keys'

export function useExamResults(params: {
  page?: number
  limit?: number
  examId?: string
  userId?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 20, examId, userId } = params
  const query = useQuery({
    queryKey: queryKeys.admin.examResults({ page, limit, examId, userId }),
    queryFn: () => examResultService.list({ page, limit, examId, userId }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.examResults() })
  }, [qc])

  const data = query.data as {
    data: ExamResultRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    stats: { totalResults: number; avgScore: number; avgTime: number; highestScore: number }
  } | undefined

  return {
    results: (data?.data ?? []) as ExamResultRecord[],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
