'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { packageService, type PackageRecord } from '@/services/api/package.service'
import { queryKeys } from '@/lib/query-keys'

export function usePackages(params: {
  page?: number
  limit?: number
  search?: string
  classLevel?: string
} = {}) {
  const qc = useQueryClient()
  const { page = 1, limit = 20, search, classLevel } = params
  const query = useQuery({
    queryKey: queryKeys.admin.packages({ page, limit, search, classLevel }),
    queryFn: () => packageService.list({ page, limit, search, classLevel }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.packages() })
  }, [qc])

  const data = query.data as {
    packages: PackageRecord[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  } | undefined

  return {
    packages: (data?.packages ?? []) as PackageRecord[],
    total: data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
