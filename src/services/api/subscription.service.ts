import { api } from '@/lib/api-client'

export interface SubscriptionRecord {
  id: string
  userId: string
  packageId: string
  classLevel: string
  startDate: string
  endDate: string
  isActive: boolean
  paymentId: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
  package: { id: string; title: string; duration: number; durationLabel: string; price: number }
}

export type SubscriptionListParams = {
  page?: number
  limit?: number
  isActive?: string
  packageId?: string
  userId?: string
}

export interface SubscriptionListResponse {
  data: SubscriptionRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalSubscriptions: number
    activeSubscriptions: number
    expiredButActive: number
  }
}

export interface SubscriptionUpdatePayload {
  id: string
  isActive?: boolean
  extendDays?: number
}

export interface SubscriptionBulkPayload {
  ids: string[]
  isActive: boolean
}

export const subscriptionService = {
  list: (params?: SubscriptionListParams) =>
    api.get<SubscriptionListResponse>('admin/subscriptions', params),
  update: (data: SubscriptionUpdatePayload) =>
    api.put<{ message: string; data: SubscriptionRecord }>('admin/subscriptions', data),
  remove: (id: string) =>
    api.delete<{ message: string }>('admin/subscriptions', { id }),
  bulkDelete: (ids: string[]) =>
    api.delete<{ success: boolean }>('admin/subscriptions', { ids: ids.join(',') }),
  bulkToggle: (data: SubscriptionBulkPayload) =>
    api.patch<{ success: boolean }>('admin/subscriptions', { ids: data.ids.join(','), isActive: data.isActive }),
}
