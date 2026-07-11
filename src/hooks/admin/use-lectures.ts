'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { lectureService, type LectureListParams, type LectureRecord } from '@/services/api/lecture.service'
import { queryKeys } from '@/lib/query-keys'

export function useLectures(params: LectureListParams = {}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.lectures(params),
    queryFn: () => lectureService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.lectures() })
  }, [qc])

  return {
    lectures: (query.data?.data ?? []) as LectureRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
