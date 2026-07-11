'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { faqService, type FAQRecord } from '@/services/api/faq.service'
import { queryKeys } from '@/lib/query-keys'

export function useFaqs(category?: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: [...queryKeys.faqs, category ?? 'all'],
    queryFn: () => faqService.list(category),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.faqs })
  }, [qc])

  return {
    faqs: (query.data ?? []) as FAQRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
