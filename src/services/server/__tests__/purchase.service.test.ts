import { describe, it, expect, beforeEach } from 'vitest'

const mockDb = vi.hoisted(() => ({
  payment: { create: vi.fn(), findMany: vi.fn() },
  userSubscription: { findFirst: vi.fn() },
  mCQ: { findUnique: vi.fn() },
}))

vi.mock('@/lib/db', () => ({ db: mockDb }))

const { PurchaseService } = await import('../purchase.service')

describe('PurchaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPayment', () => {
    it('creates a pending payment with resolved title', async () => {
      mockDb.mCQ.findUnique.mockResolvedValue({ question: 'What is 2+2?' })
      mockDb.payment.create.mockResolvedValue({
        id: 'pay-1',
        userId: 'user-1',
        contentType: 'mcq',
        contentId: 'mcq-1',
        contentTitle: 'What is 2+2?',
        amount: 100,
        method: 'bkash',
        status: 'pending',
      })

      const result = await PurchaseService.createPayment({
        userId: 'user-1',
        contentType: 'mcq',
        contentId: 'mcq-1',
        amount: 100,
      })

      expect(result.contentTitle).toBe('What is 2+2?')
      expect(result.status).toBe('pending')
      expect(mockDb.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          contentType: 'mcq',
          contentId: 'mcq-1',
          amount: 100,
          status: 'pending',
        }),
      })
    })

    it('creates payment with optional fields', async () => {
      mockDb.mCQ.findUnique.mockResolvedValue({ question: 'Test?' })
      mockDb.payment.create.mockResolvedValue({ id: 'pay-2' })

      await PurchaseService.createPayment({
        userId: 'user-2',
        contentType: 'mcq',
        contentId: 'mcq-2',
        amount: 200,
        method: 'nagad',
        paymentNumber: '01XXXXXXXXX',
        transactionId: 'TXN123',
      })

      expect(mockDb.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          method: 'nagad',
          paymentNumber: '01XXXXXXXXX',
          transactionId: 'TXN123',
        }),
      })
    })

    it('uses empty string for title when content not found', async () => {
      mockDb.mCQ.findUnique.mockResolvedValue(null)
      mockDb.payment.create.mockResolvedValue({ id: 'pay-3' })

      await PurchaseService.createPayment({
        userId: 'user-3',
        contentType: 'mcq',
        contentId: 'missing',
        amount: 50,
      })

      expect(mockDb.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ contentTitle: '' }),
      })
    })
  })

  describe('getActiveSubscription', () => {
    it('returns active subscription for matching classLevel', async () => {
      const subscription = {
        id: 'sub-1',
        classLevel: 'class-6',
        isActive: true,
        endDate: new Date('2099-01-01'),
        package: { title: 'Gold', durationLabel: '1 Year' },
      }
      mockDb.userSubscription.findFirst.mockResolvedValue(subscription)

      const result = await PurchaseService.getActiveSubscription('user-1', 'class-6')

      expect(result).toEqual(subscription)
      expect(mockDb.userSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          classLevel: 'class-6',
          isActive: true,
          endDate: { gte: expect.any(Date) },
        },
        include: {
          package: { select: { title: true, durationLabel: true } },
        },
      })
    })

    it('returns null when no active subscription', async () => {
      mockDb.userSubscription.findFirst.mockResolvedValue(null)
      const result = await PurchaseService.getActiveSubscription('user-1', 'class-10')
      expect(result).toBeNull()
    })
  })

  describe('getUserPurchases', () => {
    it('returns approved payments ordered by creation date', async () => {
      const payments = [
        { id: 'pay-1', amount: 100, status: 'approved', isActive: true },
        { id: 'pay-2', amount: 200, status: 'approved', isActive: true },
      ]
      mockDb.payment.findMany.mockResolvedValue(payments)

      const result = await PurchaseService.getUserPurchases('user-1')

      expect(result).toEqual(payments)
      expect(mockDb.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'approved', isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('returns empty array when no purchases', async () => {
      mockDb.payment.findMany.mockResolvedValue([])
      const result = await PurchaseService.getUserPurchases('user-1')
      expect(result).toEqual([])
    })
  })

  describe('hasAdminAccess', () => {
    it('returns true for admin auth result', async () => {
      await expect(PurchaseService.hasAdminAccess({ isAdmin: true } as any)).resolves.toBe(true)
    })

    it('returns false for non-admin auth result', async () => {
      await expect(PurchaseService.hasAdminAccess({ isAdmin: false } as any)).resolves.toBe(false)
    })

    it('returns false for null auth', async () => {
      await expect(PurchaseService.hasAdminAccess(null)).resolves.toBe(false)
    })
  })
})
