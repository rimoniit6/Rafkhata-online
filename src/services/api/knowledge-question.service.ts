import { api } from '@/lib/api-client'

export type KnowledgeQuestionListParams = {
  chapterId?: string
  type?: string
  q?: string
  isPremium?: boolean
  isActive?: boolean
  classLevel?: string
  subjectId?: string
  page?: number
  limit?: number
}

export interface KnowledgeQuestionListResponse {
  data: KnowledgeQuestionRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface KnowledgeQuestionRecord {
  id: string
  chapterId: string
  question: string
  answer: string
  questionImage: string | null
  answerImage: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
  createdAt: string
  chapter?: {
    id: string
    name: string
    slug: string
    subject?: { id: string; name: string; class?: { id: string; name: string; slug: string } }
  }
}

export interface KnowledgeQuestionInput {
  chapterId: string
  type?: string
  question: string
  answer: string
  questionImage?: string | null
  answerImage?: string | null
  isPremium?: boolean
  price?: number
  order?: number
  isActive?: boolean
}

export interface KnowledgeBulkImportResult {
  success: number
  errors: { row: number; message: string }[]
  total: number
}

export const knowledgeQuestionService = {
  list: (params?: KnowledgeQuestionListParams) =>
    api.get<KnowledgeQuestionListResponse>('admin/knowledge-questions', params),
  create: (data: KnowledgeQuestionInput) =>
    api.post<KnowledgeQuestionRecord>('admin/knowledge-questions', data),
  update: (id: string, data: Partial<KnowledgeQuestionInput>) =>
    api.put<KnowledgeQuestionRecord>('admin/knowledge-questions', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/knowledge-questions', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: boolean }>('admin/knowledge-questions', { ids: ids.join(',') }),
  bulkImport: (formData: FormData) =>
    api.post<KnowledgeBulkImportResult>('admin/bulk-import', formData),
}
