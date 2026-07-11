'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { contentTypeService, type ContentTypeRecord } from '@/services/api/content-type.service'
import { queryKeys } from '@/lib/query-keys'

export function useContentTypes() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.contentTypes(),
    queryFn: () => contentTypeService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.contentTypes() })
  }, [qc])

  return {
    contentTypes: (query.data ?? []) as ContentTypeRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
