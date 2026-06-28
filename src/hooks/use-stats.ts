'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

interface StatsData {
  students: number
  mcqs: number
  lectures: number
  cqs: number
  exams: number
}

export function useStats() {
  return useQuery<StatsData>({
    queryKey: ['public-stats'],
    queryFn: () => fetchJSON<StatsData>('/api/stats'),
    staleTime: 5 * 60 * 1000,
  })
}
