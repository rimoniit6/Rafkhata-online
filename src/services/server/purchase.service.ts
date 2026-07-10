import { db } from '@/lib/db'
import {
  checkContentAccess,
  batchCheckContentAccess,
  resolveContentClassLevel,
  resolveContentTitle,
  type AccessCheckParams,
  type AccessCheckResult,
  type BatchAccessCheckParams,
  type ContentType,
} from '@/lib/access-control'
import type { AuthResult } from '@/lib/auth'

export type { AccessCheckResult, ContentType }

export class PurchaseService {
  static async checkAccess(params: AccessCheckParams): Promise<AccessCheckResult> {
    return checkContentAccess(params)
  }

  static async batchCheckAccess(params: BatchAccessCheckParams): Promise<Map<string, AccessCheckResult>> {
    return batchCheckContentAccess(params)
  }

  static async resolveClassLevel(contentType: ContentType, contentId: string): Promise<string | null> {
    return resolveContentClassLevel(contentType, contentId)
  }

  static async resolveTitle(contentType: ContentType, contentId: string): Promise<string | null> {
    return resolveContentTitle(contentType, contentId)
  }

  static async createPayment(data: {
    userId: string
    contentType: string
    contentId: string
    amount: number
    method?: string
    paymentNumber?: string
    transactionId?: string
  }) {
    const title = await resolveContentTitle(data.contentType as ContentType, data.contentId)
    return db.payment.create({
      data: {
        userId: data.userId,
        contentType: data.contentType,
        contentId: data.contentId,
        contentTitle: title || '',
        amount: data.amount,
        method: (data.method?.toUpperCase() as 'BKASH' | 'NAGAD' | 'ROCKET' | 'OTHER') || 'BKASH',
        paymentNumber: data.paymentNumber || '',
        transactionId: data.transactionId || '',
        status: 'PENDING',
      },
    })
  }

  static async getActiveSubscription(userId: string, classLevel: string) {
    return db.userSubscription.findFirst({
      where: {
        userId,
        classLevel,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        package: { select: { title: true, durationLabel: true } },
      },
    })
  }

  static async getUserPurchases(userId: string) {
    return db.payment.findMany({
      where: { userId, status: 'APPROVED', isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async hasAdminAccess(auth: AuthResult | null): Promise<boolean> {
    return !!auth?.isAdmin
  }
}
