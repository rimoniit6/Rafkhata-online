'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { noteService, type NoteRecord, type NoteListParams } from '@/services/api/note.service'
import { queryKeys } from '@/lib/query-keys'

export function useNotes(params: NoteListParams = {}) {
  const qc = useQueryClient()
  const { page, contentType, userId, search } = params
  const query = useQuery({
    queryKey: [
      ...queryKeys.notes,
      page ?? 1,
      contentType ?? 'all',
      userId ?? '',
      search ?? '',
    ],
    queryFn: () => noteService.list({ page, contentType, userId, search }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.notes })
  }, [qc])

  return {
    notes: (query.data?.data ?? []) as NoteRecord[],
    pagination:
      query.data?.pagination ?? {
        page: page ?? 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
