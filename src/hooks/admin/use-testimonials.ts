'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { testimonialService, type TestimonialRecord } from '@/services/api/testimonial.service'
import { queryKeys } from '@/lib/query-keys'

export function useTestimonials() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.testimonials,
    queryFn: () => testimonialService.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.testimonials })
  }, [qc])

  return {
    testimonials: (query.data ?? []) as TestimonialRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
