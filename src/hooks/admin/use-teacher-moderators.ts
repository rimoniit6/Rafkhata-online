'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherModeratorService, type TeacherRecord } from '@/services/api/teacher-moderator.service'
import { queryKeys } from '@/lib/query-keys'

export function useTeacherModerators() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.teacherModerators(),
    queryFn: () => teacherModeratorService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.teacherModerators() })
  }, [qc])

  return {
    teachers: (query.data ?? []) as TeacherRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
