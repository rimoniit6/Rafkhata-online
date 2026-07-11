import { api } from '@/lib/api-client'

export interface ContentTypeRecord {
  id: string
  key: string
  labelBn: string
  labelEn: string
  description: string | null
  icon: string
  color: string
  lightColor: string | null
  textColor: string | null
  route: string | null
  paramKey: string | null
  buttonLabel: string | null
  isActive: boolean
  order: number
}

export type ContentTypeInput = {
  key: string
  labelBn: string
  labelEn: string
  description?: string | null
  icon: string
  color: string
  lightColor?: string | null
  textColor?: string | null
  route?: string | null
  paramKey?: string | null
  buttonLabel?: string | null
  showInChapterDetail?: boolean
  order?: number
  isActive?: boolean
}

export const contentTypeService = {
  list: () => api.get<ContentTypeRecord[]>('admin/content-types'),
  create: (data: ContentTypeInput) => api.post<ContentTypeRecord>('admin/content-types', data),
  update: (id: string, data: Partial<ContentTypeInput>) =>
    api.put<ContentTypeRecord>('admin/content-types', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/content-types', { id }),
}
