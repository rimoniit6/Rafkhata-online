import { api } from '@/lib/api-client'

export interface PaymentRecord {
  id: string
  amount: number
  method: string
  transactionId: string
  paymentNumber: string
  contentType: string | null
  contentId: string | null
  contentTitle: string | null
  screenshot: string | null
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string; isPremium: boolean }
}

export type PaymentListParams = {
  page?: number
  limit?: number
  status?: string
  method?: string
  contentType?: string
  q?: string
}

export interface PaymentListResponse {
  data: PaymentRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaymentApprovePayload {
  id: string
  status: 'approved'
  adminNote?: string
  reviewedBy: string
}

export interface PaymentRejectPayload {
  id: string
  status: 'rejected'
  adminNote: string
  reviewedBy: string
}

export const paymentService = {
  list: (params?: PaymentListParams) =>
    api.get<PaymentListResponse>('admin/payments', params),
  approve: (data: PaymentApprovePayload) =>
    api.patch<PaymentRecord>('admin/payments', data),
  reject: (data: PaymentRejectPayload) =>
    api.patch<PaymentRecord>('admin/payments', data),
  bulkDelete: (ids: string[]) =>
    api.delete<{ success: boolean }>('admin/payments', { ids: ids.join(',') }),
}
