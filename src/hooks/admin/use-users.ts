'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userService, type UserRecord, type UserListParams, type UserListResponse } from '@/services/api/user.service'
import { queryKeys } from '@/lib/query-keys'

export function useUsers(params?: UserListParams) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => userService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'users'] })
  }, [qc])

  const result = (query.data ?? {
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  }) as UserListResponse

  const users = useMemo(() => (result.data ?? []) as UserRecord[], [result.data])

  return {
    users,
    total: result.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
