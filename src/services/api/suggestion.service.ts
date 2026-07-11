import { api } from '@/lib/api-client'

export interface SuggestionRecord {
  id: string
  title: string
  slug: string
  content: string
  classId: string | null
  subjectId: string | null
  chapterId: string | null
  thumbnail: string | null
  pdfUrl: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
  viewCount: number
  class?: { id: string; name: string; slug: string }
  subject?: { id: string; name: string; slug: string; classId: string }
  chapter?: { id: string; name: string; slug: string; subjectId: string }
}

export type SuggestionListParams = {
  search?: string
  classId?: string
  subjectId?: string
  chapterId?: string
  isPremium?: string
  isActive?: string
  page?: number
  limit?: number
}

export interface SuggestionListResponse {
  suggestions: SuggestionRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SuggestionInput {
  title: string
  slug?: string
  content: string
  classId?: string | null
  subjectId?: string | null
  chapterId?: string | null
  thumbnail?: string | null
  pdfUrl?: string | null
  isPremium?: boolean
  price?: number
  order?: number
  isActive?: boolean
}

export const suggestionService = {
  list: (params?: SuggestionListParams) =>
    api.get<SuggestionListResponse>('admin/suggestions', params),
  create: (data: SuggestionInput) =>
    api.post<SuggestionRecord>('admin/suggestions', data),
  update: (id: string, data: Partial<SuggestionInput>) =>
    api.put<SuggestionRecord>('admin/suggestions', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/suggestions', { id }),
}
