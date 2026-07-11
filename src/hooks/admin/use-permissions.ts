'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { permissionService, type PermissionRecord } from '@/services/api/permission.service'
import { queryKeys } from '@/lib/query-keys'

export function usePermissions() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.permissions(),
    queryFn: () => permissionService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.permissions() })
  }, [qc])

  return {
    permissions: (query.data ?? []) as PermissionRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
