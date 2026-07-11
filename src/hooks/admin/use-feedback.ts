'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbackService, type FeedbackRecord, type FeedbackMessageResponse, type Message } from '@/services/api/feedback.service'
import { queryKeys } from '@/lib/query-keys'

export function useFeedback(params?: { status?: string; q?: string }) {
  const qc = useQueryClient()
  const { status, q } = params ?? {}
  const query = useQuery({
    queryKey: queryKeys.admin.feedback({ status, q }),
    queryFn: () => feedbackService.list({ status, q }),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.feedback({ status, q }) })
  }, [qc, status, q])

  return {
    feedbacks: (query.data?.data ?? []) as FeedbackRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}

export function useFeedbackMessages(feedbackId: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.feedbackMessages(feedbackId),
    queryFn: () => feedbackService.listMessages(feedbackId),
    enabled: !!feedbackId,
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.feedbackMessages(feedbackId) })
  }, [qc, feedbackId])

  return {
    data: (query.data ?? null) as FeedbackMessageResponse | null,
    feedback: (query.data as FeedbackMessageResponse | undefined)?.feedback ?? null,
    messages: ((query.data as FeedbackMessageResponse | undefined)?.messages ?? []) as Message[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
