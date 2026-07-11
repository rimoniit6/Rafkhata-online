'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService, type SettingsListResponse } from '@/services/api/settings.service'
import { queryKeys } from '@/lib/query-keys'

export function useSettings() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: () => settingsService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.settings() })
  }, [qc])

  const settings = (query.data ?? { data: [], map: {} }) as SettingsListResponse

  return {
    settings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
