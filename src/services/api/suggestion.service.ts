import { api } from '@/lib/api-client'

export interface SuggestionItem {
  id: string
  title: string
  slug: string
  content?: string | null
  classId?: string | null
  subjectId?: string | null
  chapterId?: string | null
  className?: string | null
  subjectName?: string | null
  chapterName?: string | null
  thumbnail?: string | null
  pdfUrl?: string | null
  isPremium: boolean
  price: number
  viewCount: number
  order: number
  createdAt: string
}

export const suggestionService = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<{ data: SuggestionItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('suggestions', params),

  getById: (id: string) =>
    api.get<{ data: SuggestionItem }>(`suggestions/${id}`),
}
