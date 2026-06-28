import { describe, it, expect, afterEach } from 'vitest'

const { mockState, mockTransaction } = vi.hoisted(() => {
  const state: { transactionImpl: (fn: any, opts?: any) => Promise<any> } = {
    transactionImpl: async (fn: any) => fn({}),
  }
  const mockTransaction = vi.fn(async (fn: any, opts?: any) => state.transactionImpl(fn, opts))
  return { mockState: state, mockTransaction }
})

vi.mock('@/lib/db', () => ({
  db: { $transaction: mockTransaction },
}))

const { safeTransaction } = await import('@/lib/errors')

describe('safeTransaction', () => {
  afterEach(() => {
    mockState.transactionImpl = async (fn: any) => fn({})
  })

  it('returns the transaction result on success', async () => {
    const result = await safeTransaction(() => Promise.resolve('success'))
    expect(result).toBe('success')
  })

  it('retries on P2034 (transaction conflict) and succeeds', async () => {
    let callCount = 0
    mockState.transactionImpl = async (fn: any) => {
      callCount++
      if (callCount <= 1) {
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
    mockState.transactionImpl = async () => {
      const { Prisma } = await import('@prisma/client')
      throw new Prisma.PrismaClientKnownRequestError('Persistent conflict', {
        code: 'P2034',
        clientVersion: '6.0.0',
      })
    }
    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    expect((error as any).code).toBe('P2034')
  })

  it('throws immediately on non-retryable Prisma errors (e.g., P2002)', async () => {
    mockState.transactionImpl = async () => {
      const { Prisma } = await import('@prisma/client')
      throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
      })
    }
    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    expect((error as { code: string }).code).toBe('P2002')
  })

  it('throws immediately on non-Prisma errors', async () => {
    mockState.transactionImpl = async () => {
      throw new Error('Something unexpected')
    }
    const error = await safeTransaction(() => Promise.resolve('never')).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Something unexpected')
  })
})
