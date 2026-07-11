'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { mcqExamPurchaseService, type McqExamPurchaseRecord } from '@/services/api/mcq-exam-purchase.service'
import { queryKeys } from '@/lib/query-keys'

export function useMcqExamPurchases(params: {
  page?: number
  limit?: number
  packageId?: string
  isActive?: string
  userId?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 20, packageId, isActive, userId } = params
  const query = useQuery({
    queryKey: queryKeys.admin.mcqExamPurchases({ page, limit, packageId, isActive, userId }),
    queryFn: () => mcqExamPurchaseService.list({ page, limit, packageId, isActive, userId }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.mcqExamPurchases() })
  }, [qc])

  const data = query.data as {
    data: McqExamPurchaseRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    stats: { totalPurchases: number; activePurchases: number; inactivePurchases: number }
  } | undefined

  return {
    purchases: (data?.data ?? []) as McqExamPurchaseRecord[],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
