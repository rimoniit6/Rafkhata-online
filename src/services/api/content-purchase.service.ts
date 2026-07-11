import { api } from '@/lib/api-client'

export interface ContentPurchaseRecord {
  id: string
  userId: string
  amount: number
  method: string
  transactionId: string
  contentType: string | null
  contentId: string | null
  contentTitle: string | null
  classLevel: string | null
  isActive: boolean
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string }
}

export type ContentPurchaseListParams = {
  page?: number
  limit?: number
  contentType?: string
  isActive?: string
  search?: string
}

export interface ContentPurchaseListResponse {
  data: ContentPurchaseRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalPurchases: number
    activePurchases: number
    inactivePurchases: number
  }
  contentTypeLabels: Record<string, string>
  typeStats: Record<string, { total: number; active: number; inactive: number }>
}

export interface ToggleActivePayload {
  id: string
  isActive: boolean
  reason?: string
}

export const contentPurchaseService = {
  list: (params?: ContentPurchaseListParams) =>
    api.get<ContentPurchaseListResponse>('admin/content-purchases', params),
  toggleActive: (data: ToggleActivePayload) =>
    api.patch<{ success: boolean; data: ContentPurchaseRecord }>('admin/content-purchases', data),
  bulkDelete: (ids: string[]) =>
    api.delete<{ success: boolean }>('admin/content-purchases', { ids: ids.join(',') }),
  bulkDeactivate: (ids: string[]) =>
    api.patch<{ success: boolean }>('admin/content-purchases', { ids: ids.join(','), isActive: false }),
}
