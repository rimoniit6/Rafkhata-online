import { api } from '@/lib/api-client'

export interface NoticeItem {
  id: string
  title: string
  content?: string | null
  type: string
  pdfUrl?: string | null
  linkUrl?: string | null
  linkLabel?: string | null
  thumbnail?: string | null
  classLevel?: string | null
  isPinned: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface NoticePagination {
  data: NoticeItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const noticeService = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<NoticePagination>('notices', params),

  getById: (id: string) =>
    api.get<{ data: NoticeItem }>(`notices/${id}`),
}
