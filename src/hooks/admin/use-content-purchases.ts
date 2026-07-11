'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { contentPurchaseService, type ContentPurchaseRecord } from '@/services/api/content-purchase.service'
import { queryKeys } from '@/lib/query-keys'

export function useContentPurchases(params: {
  page?: number
  limit?: number
  contentType?: string
  isActive?: string
  search?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 20, contentType, isActive, search } = params
  const query = useQuery({
    queryKey: queryKeys.admin.contentPurchases({ page, limit, contentType, isActive, search }),
    queryFn: () => contentPurchaseService.list({ page, limit, contentType, isActive, search }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.contentPurchases() })
  }, [qc])

  const data = query.data as {
    data: ContentPurchaseRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    stats: { totalPurchases: number; activePurchases: number; inactivePurchases: number }
    contentTypeLabels: Record<string, string>
    typeStats: Record<string, { total: number; active: number; inactive: number }>
  } | undefined

  return {
    purchases: (data?.data ?? []) as ContentPurchaseRecord[],
    pagination: data?.pagination,
    stats: data?.stats,
    contentTypeLabels: data?.contentTypeLabels ?? {},
    typeStats: data?.typeStats ?? {},
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
