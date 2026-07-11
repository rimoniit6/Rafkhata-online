'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  knowledgeQuestionService,
  type KnowledgeQuestionListParams,
  type KnowledgeQuestionRecord,
} from '@/services/api/knowledge-question.service'
import { queryKeys } from '@/lib/query-keys'

export function useKnowledgeQuestions(params: KnowledgeQuestionListParams = {}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.admin.knowledgeQuestions(params),
    queryFn: () => knowledgeQuestionService.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.knowledgeQuestions() })
  }, [qc])

  return {
    questions: (query.data?.data ?? []) as KnowledgeQuestionRecord[],
    total: query.data?.pagination?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
