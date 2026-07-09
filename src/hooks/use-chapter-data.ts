'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

export interface ChapterData {
  id: string
  name: string
  number: number
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
  lectureCount: number
  mcqCount: number
  cqCount: number
  boardQuestionCount: number
  progress: number
  contentCounts: Record<string, number>
  freeContentCounts: Record<string, number>
}

export function useChapterData(chapterId: string | undefined) {
  return useQuery<ChapterData>({
    queryKey: ['chapter', chapterId],
    queryFn: () => fetchJSON<ChapterData>(`/api/chapters/${chapterId}`),
    enabled: !!chapterId,
    staleTime: 30_000,
  })
}
