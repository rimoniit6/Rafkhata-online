import { api } from '@/lib/api-client'

export type LectureListParams = {
  q?: string
  chapterId?: string
  subjectId?: string
  isPremium?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}

export interface LectureListResponse {
  data: LectureRecord[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface LectureRecord {
  id: string
  title: string
  slug: string
  chapterId: string
  content: string
  videoUrl: string | null
  audioUrl: string | null
  pdfUrl: string | null
  thumbnail: string | null
  duration: number
  isPremium: boolean
  price: number
  viewCount: number
  isActive: boolean
  chapter?: {
    id: string
    name: string
    subjectId: string
    subject?: { id: string; name: string; classId: string; class?: { id: string; name: string; slug: string } }
  }
  _count?: { resources: number }
}

export interface LectureInput {
  title: string
  slug?: string
  chapterId: string
  content: string
  videoUrl?: string | null
  audioUrl?: string | null
  pdfUrl?: string | null
  thumbnail?: string | null
  duration?: number
  order?: number
  isPremium?: boolean
  price?: number
  isActive?: boolean
}

export const lectureService = {
  list: (params?: LectureListParams) =>
    api.get<LectureListResponse>('admin/lectures', params),
  create: (data: LectureInput) => api.post<LectureRecord>('admin/lectures', data),
  update: (id: string, data: Partial<LectureInput>) =>
    api.put<LectureRecord>('admin/lectures', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/lectures', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/lectures', { ids: ids.join(',') }),
}
