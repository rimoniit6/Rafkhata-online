import { describe, it, expect } from 'vitest'
import {
  adminUpdateUserSchema,
  adminBulkActionSchema,
  adminContentSchema,
  paginationSchema,
  createPaymentSchema,
  reviewPaymentSchema,
  mcqSchema,
} from '@/lib/validations'

// ====================================================================
// Pagination Schema
// ====================================================================

describe('paginationSchema', () => {
  it('parses valid pagination', () => {
    const result = paginationSchema.parse({ page: '2', limit: '50' })
    expect(result.page).toBe(2)
    expect(result.limit).toBe(50)
  })

  it('uses defaults for missing values', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('rejects negative page', () => {
    expect(() => paginationSchema.parse({ page: '-1' })).toThrow()
  })

  it('rejects limit over 100', () => {
    expect(() => paginationSchema.parse({ limit: '200' })).toThrow()
  })
})

// ====================================================================
// Create Payment Schema
// ====================================================================

describe('createPaymentSchema', () => {
  const validPayment = {
    amount: 100,
    method: 'bkash' as const,
    transactionId: 'TRX123',
    paymentNumber: '01700000000',
  }

  it('parses valid payment', () => {
    const result = createPaymentSchema.parse(validPayment)
    expect(result.amount).toBe(100)
    expect(result.method).toBe('bkash')
  })

  it('rejects negative amount', () => {
    expect(() => createPaymentSchema.parse({ ...validPayment, amount: -10 })).toThrow()
  })

  it('rejects invalid method', () => {
    expect(() => createPaymentSchema.parse({ ...validPayment, method: 'credit' })).toThrow()
  })

  it('rejects empty transactionId', () => {
    expect(() => createPaymentSchema.parse({ ...validPayment, transactionId: '' })).toThrow()
  })

  it('accepts optional fields', () => {
    const result = createPaymentSchema.parse({
      ...validPayment,
      screenshot: 'https://example.com/img.jpg',
      contentType: 'mcq',
      contentId: '123',
      contentTitle: 'Test MCQ',
    })
    expect(result.screenshot).toBe('https://example.com/img.jpg')
    expect(result.contentType).toBe('mcq')
  })
})

// ====================================================================
// Review Payment Schema
// ====================================================================

describe('reviewPaymentSchema', () => {
  it('parses valid review', () => {
    const result = reviewPaymentSchema.parse({ id: 'pay-1', status: 'approved' })
    expect(result.id).toBe('pay-1')
    expect(result.status).toBe('approved')
  })

  it('rejects invalid status', () => {
    expect(() => reviewPaymentSchema.parse({ id: 'pay-1', status: 'pending' })).toThrow()
  })

  it('accepts optional adminNote', () => {
    const result = reviewPaymentSchema.parse({ id: 'pay-1', status: 'rejected', adminNote: 'Invalid screenshot' })
    expect(result.adminNote).toBe('Invalid screenshot')
  })
})

// ====================================================================
// Admin Update User Schema
// ====================================================================

describe('adminUpdateUserSchema', () => {
  it('parses valid update with single id', () => {
    const result = adminUpdateUserSchema.parse({
      id: 'user-1',
      name: 'New Name',
      role: 'ADMIN',
    })
    expect(result.id).toBe('user-1')
    expect(result.name).toBe('New Name')
    expect(result.role).toBe('ADMIN')
  })

  it('parses valid update with multiple ids', () => {
    const result = adminUpdateUserSchema.parse({
      ids: ['user-1', 'user-2'],
      role: 'STUDENT',
      isVerified: true,
    })
    expect(result.ids).toHaveLength(2)
    expect(result.isVerified).toBe(true)
  })

  it('rejects invalid role', () => {
    expect(() => adminUpdateUserSchema.parse({ id: 'user-1', role: 'MODERATOR' })).toThrow()
  })

  it('accepts partial update', () => {
    const result = adminUpdateUserSchema.parse({ id: 'user-1', isPremium: true })
    expect(result.isPremium).toBe(true)
  })
})

// ====================================================================
// Admin Bulk Action Schema
// ====================================================================

describe('adminBulkActionSchema', () => {
  it('parses valid bulk action', () => {
    const result = adminBulkActionSchema.parse({ ids: ['a', 'b'], action: 'delete' })
    expect(result.ids).toHaveLength(2)
    expect(result.action).toBe('delete')
  })

  it('rejects empty ids array', () => {
    expect(() => adminBulkActionSchema.parse({ ids: [] })).toThrow()
  })

  it('accepts action as optional', () => {
    const result = adminBulkActionSchema.parse({ ids: ['a'] })
    expect(result.ids).toEqual(['a'])
    expect(result.action).toBeUndefined()
  })
})

// ====================================================================
// Admin Content Schema
// ====================================================================

describe('adminContentSchema', () => {
  it('parses valid content update', () => {
    const result = adminContentSchema.parse({
      title: 'Updated Title',
      isActive: true,
      isPremium: false,
      price: 50,
      order: 1,
    })
    expect(result.title).toBe('Updated Title')
    expect(result.isActive).toBe(true)
    expect(result.price).toBe(50)
  })

  it('accepts partial content update', () => {
    const result = adminContentSchema.parse({ isActive: false })
    expect(result.isActive).toBe(false)
  })

  it('rejects empty title', () => {
    expect(() => adminContentSchema.parse({ title: '' })).toThrow()
  })
})

// ====================================================================
// MCQ Schema
// ====================================================================

describe('mcqSchema', () => {
  const validMCQ = {
    question: 'What is 2+2?',
    optionA: '3',
    optionB: '4',
    optionC: '5',
    optionD: '6',
    correctAnswer: 'B' as const,
    chapterId: 'ch-1',
    classLevel: '9',
    subjectId: 'sub-1',
  }

  it('parses valid MCQ', () => {
    const result = mcqSchema.parse(validMCQ)
    expect(result.question).toBe('What is 2+2?')
    expect(result.correctAnswer).toBe('B')
    expect(result.difficulty).toBe('medium')
  })

  it('rejects missing question', () => {
    expect(() => mcqSchema.parse({ ...validMCQ, question: '' })).toThrow()
  })

  it('rejects invalid correct answer', () => {
    expect(() => mcqSchema.parse({ ...validMCQ, correctAnswer: 'E' })).toThrow()
  })

  it('accepts optional fields', () => {
    const result = mcqSchema.parse({ ...validMCQ, explanation: 'Basic math', isPremium: true, price: 10 })
    expect(result.explanation).toBe('Basic math')
    expect(result.isPremium).toBe(true)
  })
})
