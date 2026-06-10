import { api } from '@/lib/api-client'

export interface PaymentRequest {
  amount: number
  method: string
  transactionId: string
  paymentNumber?: string
  screenshot?: string | null
  contentType?: string
  contentId?: string
  contentTitle?: string
  classLevel?: string
}

export interface PaymentItem {
  id: string
  userId: string
  amount: number
  method: string
  transactionId: string
  paymentNumber?: string | null
  screenshot?: string | null
  contentType?: string | null
  contentId?: string | null
  contentTitle?: string | null
  classLevel?: string | null
  status: string
  adminNote?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string | null; email: string }
}

export interface AccessCheckResult {
  purchased: boolean
  pendingPayment: boolean
  reason?: string | null
}

export interface BundleItemData {
  id: string
  contentType: string
  contentId: string
  contentTitle: string | null
  contentPrice: number
  order: number
}

export const paymentService = {
  // Create payment
  create: (data: PaymentRequest) =>
    api.post<{ message: string; payment: PaymentItem }>('payment', data),

  // List payments (authenticated user sees own, admin can see all)
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<{ payments: PaymentItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      'payment',
      params,
      { retries: 1, retryDelay: 1500 }  // idempotent GET — safe to retry
    ),

  // Get payment by ID
  getById: (id: string) =>
    api.get<{ payment: PaymentItem }>(`payment/${id}`),

  // User payments
  getUserPayments: () =>
    api.get<{ data: PaymentItem[] }>(
      'user/payments',
      undefined,
      { retries: 1, retryDelay: 1500 }  // idempotent GET — safe to retry
    ),

  // Check content access (called frequently — resilient to transient failures)
  checkAccess: (contentType: string, contentId: string, userId: string) =>
    api.get<AccessCheckResult>(
      'payment/check',
      { contentType, contentId, userId },
      { retries: 1, retryDelay: 1000 }  // idempotent GET — safe to retry
    ),

  // Batch check access (subscriptions)
  batchCheckAccess: (data: { contentIds: string[]; contentType: string }) =>
    api.post<{ accessMap: Record<string, boolean> }>(
      'payment/batch-check',
      data,
      { retries: 1, retryDelay: 1500 }  // POST but safe — server checks duplicates
    ),

  // Bundle items
  getBundleItems: (bundleId: string) =>
    api.get<{ data: { items: BundleItemData[]; title: string } }>(
      `bundles/${bundleId}`,
      undefined,
      { retries: 1, retryDelay: 1500 }  // idempotent GET — safe to retry
    ),

  getBundlesForContent: (contentType: string, contentId: string) =>
    api.get<{ data: { bundles: { id: string; title: string }[] } }>('content/bundles-for', { contentType, contentId }),
}
