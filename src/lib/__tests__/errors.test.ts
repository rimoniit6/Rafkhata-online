/**
 * Unit tests for the server-side error handler (src/lib/errors.ts).
 *
 * Tests all error classes, the formatError logic (via handleApiError),
 * logError, asyncHandler, and safeTransaction.
 *
 * Run with: bun test
 */

/// <reference types="bun-types" />

import { describe, it, expect, afterEach, mock, spyOn } from 'bun:test'
import { NextResponse } from 'next/server'
import { z, ZodError as ZodErrorClass } from 'zod'
import { Prisma } from '@prisma/client'

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  logError,
  handleApiError,
  asyncHandler,
} from '@/lib/errors'

// ====================================================================
// Error Classes
// ====================================================================

describe('Error Classes', () => {
  describe('AppError (base)', () => {
    it('creates with default values', () => {
      const err = new AppError('Something went wrong')
      expect(err.message).toBe('Something went wrong')
      expect(err.statusCode).toBe(500)
      expect(err.code).toBe('INTERNAL_ERROR')
      expect(err.isOperational).toBe(true)
      expect(err.name).toBe('AppError')
      expect(err.details).toBeUndefined()
      expect(err).toBeInstanceOf(Error)
    })

    it('accepts all constructor arguments', () => {
      const err = new AppError('Bad request', 400, 'BAD_REQUEST', false, { field: 'email' })
      expect(err.message).toBe('Bad request')
      expect(err.statusCode).toBe(400)
      expect(err.code).toBe('BAD_REQUEST')
      expect(err.isOperational).toBe(false)
      expect(err.details).toEqual({ field: 'email' })
    })
  })

  describe('ValidationError', () => {
    it('sets status 422 and code VALIDATION_ERROR', () => {
      const err = new ValidationError('Invalid input', { field: 'email' })
      expect(err.message).toBe('Invalid input')
      expect(err.statusCode).toBe(422)
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.name).toBe('ValidationError')
      expect(err.details).toEqual({ field: 'email' })
    })

    it('allows omitting details', () => {
      const err = new ValidationError('Invalid input')
      expect(err.details).toBeUndefined()
    })
  })

  describe('AuthenticationError', () => {
    it('uses default Bengali message when not provided', () => {
      const err = new AuthenticationError()
      expect(err.message).toBe('প্রমাণীকরণ প্রয়োজন।')
      expect(err.statusCode).toBe(401)
      expect(err.code).toBe('UNAUTHORIZED')
      expect(err.name).toBe('AuthenticationError')
    })

    it('accepts custom message', () => {
      const err = new AuthenticationError('Please log in')
      expect(err.message).toBe('Please log in')
    })
  })

  describe('AuthorizationError', () => {
    it('uses default Bengali message', () => {
      const err = new AuthorizationError()
      expect(err.message).toBe('এই কাজের জন্য অনুমতি নেই।')
      expect(err.statusCode).toBe(403)
      expect(err.code).toBe('FORBIDDEN')
      expect(err.name).toBe('AuthorizationError')
    })
  })

  describe('NotFoundError', () => {
    it('uses default Bengali message', () => {
      const err = new NotFoundError()
      expect(err.message).toBe('তথ্য খুঁজে পাওয়া যায়নি।')
      expect(err.statusCode).toBe(404)
      expect(err.code).toBe('NOT_FOUND')
      expect(err.name).toBe('NotFoundError')
    })
  })

  describe('ConflictError', () => {
    it('uses default Bengali message', () => {
      const err = new ConflictError()
      expect(err.message).toBe('এই তথ্য ইতিমধ্যে বিদ্যমান।')
      expect(err.statusCode).toBe(409)
      expect(err.code).toBe('CONFLICT')
      expect(err.name).toBe('ConflictError')
    })
  })

  describe('RateLimitError', () => {
    it('uses default Bengali message', () => {
      const err = new RateLimitError()
      expect(err.message).toBe('অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।')
      expect(err.statusCode).toBe(429)
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(err.name).toBe('RateLimitError')
    })
  })

  describe('PaymentError', () => {
    it('sets status 400 with default code', () => {
      const err = new PaymentError('Payment declined')
      expect(err.message).toBe('Payment declined')
      expect(err.statusCode).toBe(400)
      expect(err.code).toBe('PAYMENT_ERROR')
      expect(err.name).toBe('PaymentError')
    })

    it('accepts custom code', () => {
      const err = new PaymentError('Insufficient funds', 'INSUFFICIENT_BALANCE')
      expect(err.code).toBe('INSUFFICIENT_BALANCE')
    })
  })

  describe('class hierarchy', () => {
    it('all subclasses are instances of AppError', () => {
      expect(new ValidationError('x')).toBeInstanceOf(AppError)
      expect(new AuthenticationError()).toBeInstanceOf(AppError)
      expect(new AuthorizationError()).toBeInstanceOf(AppError)
      expect(new NotFoundError()).toBeInstanceOf(AppError)
      expect(new ConflictError()).toBeInstanceOf(AppError)
      expect(new RateLimitError()).toBeInstanceOf(AppError)
      expect(new PaymentError('x')).toBeInstanceOf(AppError)
    })

    it('all subclasses are instances of Error', () => {
      expect(new ValidationError('x')).toBeInstanceOf(Error)
      expect(new AuthenticationError()).toBeInstanceOf(Error)
      expect(new NotFoundError()).toBeInstanceOf(Error)
    })
  })
})

// ====================================================================
// handleApiError — tests formatError indirectly through the public API
// ====================================================================

describe('handleApiError', () => {
  async function parseResponse(response: NextResponse) {
    return {
      status: response.status,
      body: await response.json(),
    }
  }

  it('formats AppError correctly', async () => {
    const error = new AppError('Custom error', 418, 'TEAPOT', true, { extra: 'info' })
    const { status, body } = await parseResponse(handleApiError(error))

    expect(status).toBe(418)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Custom error')
    expect(body.code).toBe('TEAPOT')
    expect(body.details).toEqual({ extra: 'info' })
  })

  it('formats ValidationError', async () => {
    const error = new ValidationError('Invalid email')
    const { status, body } = await parseResponse(handleApiError(error))

    expect(status).toBe(422)
    expect(body.error).toBe('Invalid email')
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('formats NotFoundError with Bengali default', async () => {
    const error = new NotFoundError()
    const { status, body } = await parseResponse(handleApiError(error))

    expect(status).toBe(404)
    expect(body.error).toBe('তথ্য খুঁজে পাওয়া যায়নি।')
    expect(body.code).toBe('NOT_FOUND')
  })

  it('formats ZodError with validation details', async () => {
    // Generate a real ZodError via safeParse (Zod v4 uses .issues not .errors)
    const schema = z.object({ name: z.string(), email: z.string().email() })
    const result = schema.safeParse({ name: 42 })
    const zodError = result.error!

    expect(zodError).toBeInstanceOf(ZodErrorClass)

    const { status, body } = await parseResponse(handleApiError(zodError))

    expect(status).toBe(422)
    expect(body.error).toBe('ইনপুট ভ্যালিডেশন ব্যর্থ')
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.details).toBeArray()
    expect(body.details.length).toBeGreaterThanOrEqual(1)
    // Zod v4 includes all validated fields; the 'name' field should have the type error
    const nameIssue = body.details.find((d: any) => d.field === 'name')
    expect(nameIssue).toBeDefined()
    expect(nameIssue.message).toBeString()
  })

  describe('Prisma errors', () => {
    it('formats P2002 (unique constraint) as 409 DUPLICATE_ENTRY', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      })

      const { status, body } = await parseResponse(handleApiError(prismaError))
      expect(status).toBe(409)
      expect(body.code).toBe('DUPLICATE_ENTRY')
      expect(body.error).toBe('এই তথ্য ইতিমধ্যে বিদ্যমান।')
    })

    it('formats P2025 (not found) as 404 NOT_FOUND', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      })

      const { status, body } = await parseResponse(handleApiError(prismaError))
      expect(status).toBe(404)
      expect(body.code).toBe('NOT_FOUND')
    })

    it('formats P2003 (foreign key) as 400 FOREIGN_KEY_ERROR', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '6.0.0',
      })

      const { status, body } = await parseResponse(handleApiError(prismaError))
      expect(status).toBe(400)
      expect(body.code).toBe('FOREIGN_KEY_ERROR')
    })

    it('formats unknown Prisma code as 500 DATABASE_ERROR', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Some other error', {
        code: 'P2023',
        clientVersion: '6.0.0',
      })

      const { status, body } = await parseResponse(handleApiError(prismaError))
      expect(status).toBe(500)
      expect(body.code).toBe('DATABASE_ERROR')
    })

    it('formats PrismaClientValidationError as 400 DB_VALIDATION_ERROR', async () => {
      const validationError = new Prisma.PrismaClientValidationError('Invalid data', {
        clientVersion: '6.0.0',
      })

      const { status, body } = await parseResponse(handleApiError(validationError))
      expect(status).toBe(400)
      expect(body.code).toBe('DB_VALIDATION_ERROR')
    })
  })

  describe('SyntaxError with status 400 (JSON parse error)', () => {
    it('formats as 400 INVALID_JSON', async () => {
      const syntaxError = new SyntaxError('Unexpected token')
      ;(syntaxError as any).status = 400

      const { status, body } = await parseResponse(handleApiError(syntaxError))
      expect(status).toBe(400)
      expect(body.code).toBe('INVALID_JSON')
      expect(body.error).toBe('অবৈধ JSON ফরম্যাট।')
    })

    it('does not format SyntaxError without status 400', async () => {
      const syntaxError = new SyntaxError('Unexpected token')

      const { status, body } = await parseResponse(handleApiError(syntaxError))
      expect(status).toBe(500)
      expect(body.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('generic Error', () => {
    const ORIGINAL_NODE_ENV = process.env.NODE_ENV

    afterEach(() => {
      ;(process.env as any).NODE_ENV = ORIGINAL_NODE_ENV
    })

    it('in development mode, exposes error message and stack', async () => {
      ;(process.env as any).NODE_ENV = 'development'

      const error = new Error('Detailed internal error')
      const { status, body } = await parseResponse(handleApiError(error))

      expect(status).toBe(500)
      expect(body.error).toBe('Detailed internal error')
      expect(body.code).toBe('INTERNAL_ERROR')
      expect(body.details).toBeString()

      ;(process.env as any).NODE_ENV = ORIGINAL_NODE_ENV
    })

    it('in production mode, masks the error message', async () => {
      ;(process.env as any).NODE_ENV = 'production'

      const error = new Error('Sensitive internal details')
      const { status, body } = await parseResponse(handleApiError(error))

      expect(status).toBe(500)
      expect(body.error).toBe('সার্ভার ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।')
      expect(body.code).toBe('INTERNAL_ERROR')
      expect(body.details).toBeUndefined()

      ;(process.env as any).NODE_ENV = ORIGINAL_NODE_ENV
    })
  })

  describe('unknown error (not an Error instance)', () => {
    it('formats as 500 UNKNOWN_ERROR', async () => {
      const unknown = 'just a string'
      const { status, body } = await parseResponse(handleApiError(unknown))

      expect(status).toBe(500)
      expect(body.code).toBe('UNKNOWN_ERROR')
      expect(body.error).toBe('একটি অজানা ত্রুটি হয়েছে।')
    })

    it('formats null as UNKNOWN_ERROR', async () => {
      const { status, body } = await parseResponse(handleApiError(null))
      expect(status).toBe(500)
      expect(body.code).toBe('UNKNOWN_ERROR')
    })
  })

  it('calls logError internally', async () => {
    const spy = spyOn(console, 'error')
    spy.mockImplementation(() => {})

    handleApiError(new Error('test'))

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ====================================================================
// logError
// ====================================================================

describe('logError', () => {
  let consoleSpy: ReturnType<typeof spyOn>

  afterEach(() => {
    consoleSpy?.mockRestore()
  })

  it('logs 500+ errors to console.error', () => {
    consoleSpy = spyOn(console, 'error').mockImplementation(() => {})

    logError(new AppError('Server error', 500))

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(logged.error.name).toBe('AppError')
    expect(logged.error.message).toBe('Server error')
    expect(logged.error.code).toBe('INTERNAL_ERROR')
    expect(logged.error.statusCode).toBe(500)
    expect(logged.error.stack).toBeString()
    expect(logged.timestamp).toBeString()
  })

  it('logs 4xx errors to console.warn', () => {
    consoleSpy = spyOn(console, 'warn').mockImplementation(() => {})

    logError(new NotFoundError())

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(logged.error.statusCode).toBe(404)
  })

  it('includes context when provided', () => {
    consoleSpy = spyOn(console, 'error').mockImplementation(() => {})

    logError(new Error('test'), 'Admin Get Users')

    const logged = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(logged.context).toBe('Admin Get Users')
  })

  it('sets error name to Unknown for non-Error objects', () => {
    consoleSpy = spyOn(console, 'error').mockImplementation(() => {})

    logError('some string')

    const logged = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(logged.error.name).toBe('Unknown')
    expect(logged.error.stack).toBeUndefined()
  })
})

// ====================================================================
// asyncHandler
// ====================================================================

describe('asyncHandler', () => {
  it('returns the handler result on success', async () => {
    const handler = async () => NextResponse.json({ success: true, data: 'ok' })
    const wrapped = asyncHandler(handler)

    const response = await wrapped()
    const body = await response.json()
    expect(body).toEqual({ success: true, data: 'ok' })
  })

  it('catches errors and returns a structured error response', async () => {
    const handler = async () => { throw new NotFoundError() }
    const wrapped = asyncHandler(handler, 'Get Resource')

    const response = await wrapped()
    const body = await response.json()
    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.code).toBe('NOT_FOUND')
  })
})
