import { api } from '@/lib/api-client'

export interface FAQRecord {
  id: string
  question: string
  answer: string
  category: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FAQInput {
  question: string
  answer: string
  category?: string | null
  order?: number
  isActive?: boolean
}

export const faqService = {
  list: (category?: string) =>
    api.get<FAQRecord[]>('admin/faqs', category ? { category } : undefined),
  create: (data: FAQInput) => api.post<FAQRecord>('admin/faqs', data),
  update: (id: string, data: Partial<FAQInput>) =>
    api.put<FAQRecord>('admin/faqs', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/faqs', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/faqs', { ids: ids.join(',') }),
  bulkUpdate: (ids: string[], isActive: boolean) =>
    api.put<{ updated: number }>('admin/faqs', { ids, isActive }),
}
