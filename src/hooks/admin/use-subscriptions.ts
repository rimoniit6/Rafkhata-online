'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionService, type SubscriptionRecord } from '@/services/api/subscription.service'
import { queryKeys } from '@/lib/query-keys'

export function useSubscriptions(params: {
  page?: number
  limit?: number
  isActive?: string
  packageId?: string
  userId?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 20, isActive, packageId, userId } = params
  const query = useQuery({
    queryKey: queryKeys.admin.subscriptions({ page, limit, isActive, packageId, userId }),
    queryFn: () => subscriptionService.list({ page, limit, isActive, packageId, userId }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.subscriptions() })
  }, [qc])

  const data = query.data as {
    data: SubscriptionRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    stats: { totalSubscriptions: number; activeSubscriptions: number; expiredButActive: number }
  } | undefined

  return {
    subscriptions: (data?.data ?? []) as SubscriptionRecord[],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
