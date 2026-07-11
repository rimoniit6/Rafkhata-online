'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bannerService, type BannerRecord } from '@/services/api/banner.service'
import { queryKeys } from '@/lib/query-keys'

export function useBanners() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.banners,
    queryFn: () => bannerService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.banners })
  }, [qc])

  return {
    banners: (query.data ?? []) as BannerRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
