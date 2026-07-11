import { api } from '@/lib/api-client'

export type CQListParams = {
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

export interface CQListResponse {
  data: CQRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface CQRecord {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  question1: string
  question1Image?: string | null
  question2: string
  question2Image?: string | null
  question3: string
  question3Image?: string | null
  question4: string
  question4Image?: string | null
  answer1: string
  answer1Image?: string | null
  answer2: string
  answer2Image?: string | null
  answer3: string
  answer3Image?: string | null
  answer4: string
  answer4Image?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty: string
  isPremium: boolean
  price: number
  isActive: boolean
  chapter?: { id: string; name: string }
}

export interface CQInput {
  uddeepok: string
  uddeepokImage?: string | null
  question1: string
  question1Image?: string | null
  question2?: string
  question2Image?: string | null
  question3?: string
  question3Image?: string | null
  question4?: string
  question4Image?: string | null
  answer1: string
  answer1Image?: string | null
  answer2?: string
  answer2Image?: string | null
  answer3?: string
  answer3Image?: string | null
  answer4?: string
  answer4Image?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty?: string
  isPremium?: boolean
  price?: number
  isActive?: boolean
}

export const cqService = {
  list: (params?: CQListParams) =>
    api.get<CQListResponse>('admin/cq', params),
  create: (data: CQInput) => api.post<CQRecord>('admin/cq', data),
  update: (id: string, data: Partial<CQInput>) =>
    api.put<CQRecord>('admin/cq', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/cq', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/cq', { ids: ids.join(',') }),
}
