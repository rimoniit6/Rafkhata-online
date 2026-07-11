import { api } from '@/lib/api-client'

export interface NotificationRecord {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  userId: string | null
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

export interface NotificationListResponse {
  data: NotificationRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NotificationInput {
  title: string
  message: string
  type?: string
  link?: string | null
  isRead?: boolean
  broadcast?: boolean
  userId?: string
}

export const notificationService = {
  list: (params?: { page?: number; search?: string; type?: string }) =>
    api.get<NotificationListResponse>('admin/notifications', params),
  create: (data: NotificationInput) =>
    api.post<NotificationRecord>('admin/notifications', data),
  update: (id: string, data: Partial<NotificationInput>) =>
    api.put<NotificationRecord>('admin/notifications', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/notifications', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/notifications', { ids: ids.join(',') }),
  broadcast: (data: NotificationInput) =>
    api.post<{ sentCount: number }>('admin/notifications', data),
}
