'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService, type NotificationRecord, type NotificationListResponse } from '@/services/api/notification.service'
import { queryKeys } from '@/lib/query-keys'

export function useNotifications(params?: { page?: number; search?: string; type?: string }) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.notifications(params),
    queryFn: () => notificationService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.notifications(params) })
  }, [qc, params])

  return {
    data: (query.data ?? null) as NotificationListResponse | null,
    notifications: ((query.data as NotificationListResponse | undefined)?.data ?? []) as NotificationRecord[],
    total: (query.data as NotificationListResponse | undefined)?.pagination?.total ?? 0,
    totalPages: (query.data as NotificationListResponse | undefined)?.pagination?.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
