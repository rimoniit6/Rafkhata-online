import { api } from '@/lib/api-client'

export interface PackageRecord {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  duration: number
  durationLabel: string
  classLevel: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    subscriptions: number
  }
}

export type PackageListParams = {
  page?: number
  limit?: number
  search?: string
  classLevel?: string
}

export interface PackageListResponse {
  packages: PackageRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PackageInput {
  title: string
  description?: string | null
  thumbnail?: string | null
  price?: number
  originalPrice?: number
  duration?: number
  durationLabel?: string
  classLevel?: string | null
  isActive?: boolean
  order?: number
}

export const packageService = {
  list: (params?: PackageListParams) =>
    api.get<PackageListResponse>('admin/packages', params),
  create: (data: PackageInput) =>
    api.post<PackageRecord>('admin/packages', data),
  update: (id: string, data: Partial<PackageInput>) =>
    api.put<PackageRecord>('admin/packages', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/packages', { id }),
  bulkDelete: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/packages', { ids: ids.join(',') }),
  bulkToggle: (ids: string[], isActive: boolean) =>
    api.put<{ updated: number }>('admin/packages', { ids: ids.join(','), isActive }),
}
