import { api } from '@/lib/api-client'

export interface ExamResultRecord {
  id: string
  userId: string
  examId: string
  score: number
  totalMarks: number
  timeTaken: number
  answers: string
  completedAt: string
  user: { id: string; name: string; email: string }
  exam: { id: string; title: string; type: string; classLevel: string; totalMarks: number }
}

export type ExamResultListParams = {
  page?: number
  limit?: number
  examId?: string
  userId?: string
}

export interface ExamResultListResponse {
  data: ExamResultRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalResults: number
    avgScore: number
    avgTime: number
    highestScore: number
  }
}

export const examResultService = {
  list: (params?: ExamResultListParams) =>
    api.get<ExamResultListResponse>('admin/exam-results', params),
  bulkDelete: (ids: string[]) =>
    api.delete<{ success: boolean }>('admin/exam-results', { ids: ids.join(',') }),
}
