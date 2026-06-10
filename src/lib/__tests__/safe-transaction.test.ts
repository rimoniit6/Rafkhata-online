/**
 * Unit tests for safeTransaction.
 *
 * Separated from errors.test.ts because Bun's mock.module() must be called
 * BEFORE the module under test is imported. Since ESM static imports are
 * hoisted and resolved at parse time, we use mock.module() first (module
 * level), then dynamically import() the module under test.
 */

/// <reference types="bun-types" />

import { describe, it, expect, mock, afterEach } from 'bun:test'

// ====================================================================
// Mock @/lib/db BEFORE any module that imports it is loaded
// ====================================================================

let transactionImpl: (fn: any, opts?: any) => Promise<any> = async (fn: any) => fn({})

mock.module('@/lib/db', () => ({
  db: {
    $transaction: mock(async (fn: any, opts?: any) => transactionImpl(fn, opts)),
  },
}))

// Now import after the mock is registered
const { safeTransaction, AppError } = await import('@/lib/errors')

describe('safeTransaction', () => {
  afterEach(() => {
    // Reset to default successful implementation
    transactionImpl = async (fn: any) => fn({})
  })

  it('returns the transaction result on success', async () => {
    const result = await safeTransaction(() => Promise.resolve('success'))
    expect(result).toBe('success')
  })

  it('retries on P2034 (transaction conflict) and succeeds', async () => {
    let callCount = 0

    transactionImpl = async (fn: any, _opts?: any) => {
      callCount++
      if (callCount <= 1) {
        // Throw P2034 — only retryable Prisma error
        const { Prisma } = await import('@prisma/client')
        throw new Prisma.PrismaClientKnownRequestError('Transaction conflict', {
          code: 'P2034',
          clientVersion: '6.0.0',
        })
      }
      return fn({})
    }

    const result = await safeTransaction(() => Promise.resolve('retried'))
    expect(result).toBe('retried')
    expect(callCount).toBe(2)
  })

  it('exhausts retries on persistent P2034 and throws the original error', async () => {
    transactionImpl = async (_fn: any, _opts?: any) => {
      const { Prisma } = await import('@prisma/client')
      throw new Prisma.PrismaClientKnownRequestError('Persistent conflict', {
        code: 'P2034',
        clientVersion: '6.0.0',
      })
    }

    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    // safeTransaction re-throws the original Prisma error after exhausting retries
    expect((error as any).code).toBe('P2034')
  })

  it('throws immediately on non-retryable Prisma errors (e.g., P2002)', async () => {
    transactionImpl = async (_fn: any, _opts?: any) => {
      const { Prisma } = await import('@prisma/client')
      throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
      })
    }

    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    const prismaError = error as { code: string }
    expect(prismaError.code).toBe('P2002')
  })

  it('throws immediately on non-Prisma errors', async () => {
    transactionImpl = async (_fn: any, _opts?: any) => {
      throw new Error('Something unexpected')
    }

    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Something unexpected')
  })
})
