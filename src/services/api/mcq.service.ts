import { api } from '@/lib/api-client'

export type MCQListParams = {
  q?: string
  classLevel?: string
  subjectId?: string
  chapterId?: string
  difficulty?: string
  board?: string
  year?: string
  topic?: string
  isPremium?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}

export interface MCQListResponse {
  data: MCQRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface MCQRecord {
  id: string
  question: string
  questionImage?: string | null
  optionA: string
  optionAImage?: string | null
  optionB: string
  optionBImage?: string | null
  optionC: string
  optionCImage?: string | null
  optionD: string
  optionDImage?: string | null
  correctAnswer: string
  explanation?: string | null
  explanationImage?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty: string
  isPremium: boolean
  price: number
  tags?: string | null
  isActive: boolean
  chapter?: { id: string; name: string }
}

export interface MCQInput {
  question: string
  questionImage?: string | null
  optionA: string
  optionAImage?: string | null
  optionB: string
  optionBImage?: string | null
  optionC: string
  optionCImage?: string | null
  optionD: string
  optionDImage?: string | null
  correctAnswer: string
  explanation?: string | null
  explanationImage?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty?: string
  isPremium?: boolean
  price?: number
  tags?: string | null
  isActive?: boolean
}

export const mcqService = {
  list: (params?: MCQListParams) =>
    api.get<MCQListResponse>('admin/mcq', params),
  create: (data: MCQInput) => api.post<MCQRecord>('admin/mcq', data),
  update: (id: string, data: Partial<MCQInput>) =>
    api.put<MCQRecord>('admin/mcq', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/mcq', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/mcq', { ids: ids.join(',') }),
}
