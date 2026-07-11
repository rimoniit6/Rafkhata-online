import { api } from '@/lib/api-client'

export interface NoticeRecord {
  id: string
  title: string
  content: string | null
  type: 'text' | 'pdf' | 'link'
  pdfUrl: string | null
  pdfTitle: string | null
  linkUrl: string | null
  linkLabel: string | null
  thumbnail: string | null
  classLevel: string | null
  isPinned: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type NoticeListParams = {
  search?: string
  type?: string
  classLevel?: string
}

export interface NoticeListResponse {
  data: NoticeRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NoticeInput {
  title: string
  content?: string | null
  type?: 'text' | 'pdf' | 'link'
  pdfUrl?: string | null
  pdfTitle?: string | null
  linkUrl?: string | null
  linkLabel?: string | null
  thumbnail?: string | null
  classLevel?: string | null
  isPinned?: boolean
  isActive?: boolean
  order?: number
}

export const noticeService = {
  list: (params?: NoticeListParams) =>
    api.get<NoticeListResponse>('admin/notices', params),
  create: (data: NoticeInput) =>
    api.post<NoticeRecord>('admin/notices', data),
  update: (id: string, data: Partial<NoticeInput>) =>
    api.put<NoticeRecord>('admin/notices', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/notices', { id }),
}
