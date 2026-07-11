import { api } from '@/lib/api-client'

export interface UserRecord {
  id: string
  name: string | null
  email: string
  role: string
  isPremium: boolean
  createdAt: string
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isPremium?: boolean
}

export interface UserListResponse {
  data: UserRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserUpdateInput {
  id?: string
  ids?: string[]
  name?: string
  role?: string
  phone?: string
  institute?: string
  classLevel?: string
  board?: string
  isVerified?: boolean
  isPremium?: boolean
  premiumExpiry?: string | null
}

export const userService = {
  list: (params?: UserListParams) =>
    api.get<UserListResponse>('admin/users', params as Record<string, string | number | boolean | undefined | null>),
  update: (data: UserUpdateInput) => api.patch<{ id: string }>('admin/users', data),
  remove: (id: string) => api.delete<{ id: string }>('admin/users', { id }),
  bulkRemove: (ids: string[]) => api.delete<{ deleted: number }>('admin/users', { ids: ids.join(',') }),
}
