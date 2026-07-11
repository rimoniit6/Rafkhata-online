import { api } from '@/lib/api-client'

export interface McqExamPurchaseRecord {
  id: string
  userId: string
  packageId: string
  paymentId: string | null
  purchasedAt: string
  isActive: boolean
  user: { id: string; name: string; email: string }
  package: { id: string; title: string; price: number; isPremium: boolean }
}

export type McqExamPurchaseListParams = {
  page?: number
  limit?: number
  packageId?: string
  isActive?: string
  userId?: string
}

export interface McqExamPurchaseListResponse {
  data: McqExamPurchaseRecord[]
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
}

export const mcqExamPurchaseService = {
  list: (params?: McqExamPurchaseListParams) =>
    api.get<McqExamPurchaseListResponse>('admin/mcq-exam-purchases', params),
  deactivate: (id: string) =>
    api.delete<{ success: boolean; data: { message: string } }>('admin/mcq-exam-purchases', { id }),
  bulkDelete: (ids: string[]) =>
    api.delete<{ success: boolean }>('admin/mcq-exam-purchases', { ids: ids.join(',') }),
  bulkDeactivate: (ids: string[]) =>
    api.patch<{ success: boolean }>('admin/mcq-exam-purchases', { ids: ids.join(','), isActive: false }),
}
