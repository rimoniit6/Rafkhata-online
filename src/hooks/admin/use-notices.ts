'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { noticeService, type NoticeRecord, type NoticeListParams } from '@/services/api/notice.service'
import { queryKeys } from '@/lib/query-keys'

export function useNotices(params: NoticeListParams = {}) {
  const qc = useQueryClient()
  const { search, type, classLevel } = params
  const query = useQuery({
    queryKey: [...queryKeys.notices, search ?? '', type ?? 'all', classLevel ?? 'all'],
    queryFn: () => noticeService.list({ search, type, classLevel }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.notices })
  }, [qc])

  return {
    notices: (query.data?.data ?? []) as NoticeRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
