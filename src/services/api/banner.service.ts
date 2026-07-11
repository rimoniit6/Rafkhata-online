import { api } from '@/lib/api-client'

export interface BannerRecord {
  id: string
  title: string
  subtitle: string | null
  image: string | null
  link: string | null
  buttonText: string | null
  isActive: boolean
  order: number
  startDate: string | null
  endDate: string | null
}

export type BannerInput = {
  title: string
  subtitle?: string | null
  image?: string | null
  link?: string | null
  buttonText?: string | null
  isActive?: boolean
  order?: number
  startDate?: string | null
  endDate?: string | null
}

export const bannerService = {
  list: (params?: { isActive?: boolean }) =>
    api.get<BannerRecord[]>('admin/banners', params),
  create: (data: BannerInput) => api.post<BannerRecord>('admin/banners', data),
  update: (id: string, data: Partial<BannerInput>) =>
    api.put<BannerRecord>('admin/banners', { id, ...data }),
  remove: (id: string) => api.delete<{ id: string }>('admin/banners', { id }),
}
