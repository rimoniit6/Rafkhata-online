import { api } from '@/lib/api-client'

export type ExamListParams = {
  classLevel?: string
  subjectId?: string
  type?: string
  isPremium?: boolean
  isActive?: boolean
  status?: string
  page?: number
  limit?: number
}

export interface ExamListResponse {
  data: ExamRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ExamQuestionRecord {
  id: string
  examId: string
  questionType: string
  questionId: string
  order: number
  marks: number
}

export interface ExamRecord {
  id: string
  title: string
  description: string | null
  classLevel: string
  subjectId: string | null
  chapterIds: string | null
  type: string
  duration: number
  totalMarks: number
  marksPerMcq: number
  negativeMarks: number
  isPremium: boolean
  price: number
  isActive: boolean
  status: string
  instructions: string | null
  startsAt: string | null
  endsAt: string | null
  questions: ExamQuestionRecord[]
  _count?: { results: number }
}

export interface ExamInput {
  title: string
  description?: string | null
  classLevel: string
  subjectId?: string | null
  chapterIds?: string | null
  type: string
  duration: number
  totalMarks?: number
  marksPerMcq?: number
  negativeMarks?: number
  isPremium?: boolean
  price?: number
  isActive?: boolean
  status?: string
  instructions?: string | null
  startsAt?: string | null
  endsAt?: string | null
  questions?: { questionType: string; questionId: string; marks: number; order?: number }[]
}

export type ExamQuestionBankParams = {
  classLevel?: string
  subjectId?: string
  type?: string
  q?: string
  limit?: number
}

export interface MCQQuestionItem {
  id: string
  question: string
  correctAnswer: string
  difficulty: string
  classLevel: string
  subjectId: string
  topic: string | null
  chapter: { id: string; name: string } | null
}

export interface CQQuestionItem {
  id: string
  uddeepok: string
  question1: string
  question2: string
  question3: string
  question4: string
  difficulty: string
  classLevel: string
  subjectId: string
  topic: string | null
  chapter: { id: string; name: string } | null
}

export interface ExamQuestionBankResponse {
  mcqs: MCQQuestionItem[]
  cqs: CQQuestionItem[]
}

export interface ExamBulkUploadResult {
  message: string
  success: number
  failed: number
  errors: string[]
  createdIds: string[]
}

export const examService = {
  list: (params?: ExamListParams) =>
    api.get<ExamListResponse>('admin/exams', params),
  create: (data: ExamInput) => api.post<ExamRecord>('admin/exams', data),
  update: (id: string, data: Partial<ExamInput>) =>
    api.put<ExamRecord>('admin/exams', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/exams', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/exams', { ids: ids.join(',') }),
  questions: (params?: ExamQuestionBankParams) =>
    api.get<ExamQuestionBankResponse>('admin/exams/questions', params),
  bulkUpload: (formData: FormData) =>
    api.post<ExamBulkUploadResult>('admin/mcq/bulk-upload', formData),
}
