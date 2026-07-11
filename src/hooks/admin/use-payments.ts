'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentService, type PaymentRecord } from '@/services/api/payment.service'
import { queryKeys } from '@/lib/query-keys'

export function usePayments(params: {
  page?: number
  limit?: number
  status?: string
  method?: string
  contentType?: string
  q?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 10, status, method, contentType, q } = params
  const query = useQuery({
    queryKey: queryKeys.admin.payments({ page, limit, status, method, contentType, q }),
    queryFn: () => paymentService.list({ page, limit, status, method, contentType, q }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.payments() })
  }, [qc])

  const data = query.data as {
    data: PaymentRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  } | undefined

  return {
    payments: (data?.data ?? []) as PaymentRecord[],
    pagination: data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
