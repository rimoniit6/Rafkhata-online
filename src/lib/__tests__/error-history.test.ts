/**
 * Unit tests for the dev-only error history LRU store (src/lib/error-history.ts).
 *
 * Tests the pure-logic store: captureError, subscribe/getSnapshot,
 * LRU eviction, clearErrorHistory, and the notification system.
 * No DOM/React dependency — runs in plain Bun.
 */

/// <reference types="bun-types" />

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'bun:test'
import { ApiError, type ApiErrorEvent } from '@/lib/api-client'
import {
  captureError,
  clearErrorHistory,
  subscribe,
  getSnapshot,
  getErrorCount,
  type ErrorHistoryEntry,
} from '@/lib/error-history'

// ====================================================================
// Helpers
// ====================================================================

function createEvent(overrides?: Partial<{
  status: number
  code: string
  message: string
  endpoint: string
  method: string
  details: unknown
}>): ApiErrorEvent {
  const apiError = new ApiError(
    overrides?.message ?? 'Test error',
    overrides?.status ?? 500,
    {
      code: overrides?.code ?? 'INTERNAL_ERROR',
      details: overrides?.details ?? { traceId: 'abc' },
      endpoint: overrides?.endpoint ?? '/api/test',
      method: overrides?.method ?? 'GET',
    },
  )
  return {
    error: apiError,
    endpoint: apiError.endpoint,
    method: apiError.method,
    config: {},
  }
}

// ====================================================================
// Setup / Teardown
// ====================================================================

beforeEach(() => {
  clearErrorHistory()
})

// ====================================================================
// Tests
// ====================================================================

describe('error-history', () => {
  describe('captureError', () => {
    it('adds an entry with the correct structure', () => {
      captureError(createEvent({
        status: 404,
        code: 'NOT_FOUND',
        message: 'User not found',
        endpoint: '/api/users/42',
        method: 'GET',
        details: { userId: 42 },
      }))

      const snapshot = getSnapshot()
      expect(snapshot).toHaveLength(1)

      const entry = snapshot[0]
      expect(entry.id).toBeString()
      expect(entry.id).toMatch(/^err-\d+$/)
      expect(entry.status).toBe(404)
      expect(entry.code).toBe('NOT_FOUND')
      expect(entry.message).toBe('User not found')
      expect(entry.endpoint).toBe('/api/users/42')
      expect(entry.method).toBe('GET')
      expect(entry.isRetryable).toBe(false)
      expect(entry.timestamp).toBeString()
      expect(entry.relativeTime).toBeString()
      expect(entry.details).toEqual({ userId: 42 })
    })

    it('sets isRetryable correctly from ApiError status', () => {
      captureError(createEvent({ status: 0 }))
      expect(getSnapshot()[0].isRetryable).toBe(true)
    })

    it('stores empty string code when ApiError code is empty string', () => {
      captureError(createEvent({ code: '' } as any))
      expect(getSnapshot()[0].code).toBe('')
    })

    it('stores undefined code when ApiError is created without code option', () => {
      const err = new ApiError('No code', 400)
      expect(err.code).toBeUndefined()

      captureError({
        error: err,
        endpoint: '/api/test',
        method: 'GET',
        config: {},
      })
      expect(getSnapshot()[0].code).toBeUndefined()
    })

    it('prepends entries (most recent first)', () => {
      captureError(createEvent({ message: 'first' }))
      captureError(createEvent({ message: 'second' }))

      const snapshot = getSnapshot()
      expect(snapshot).toHaveLength(2)
      expect(snapshot[0].message).toBe('second')
      expect(snapshot[1].message).toBe('first')
    })

    it('generates unique sequential IDs (entries prepended, so newest has highest ID)', () => {
      captureError(createEvent()) // err-0
      captureError(createEvent()) // err-1
      captureError(createEvent()) // err-2

      const snapshot = getSnapshot()
      const ids = snapshot.map((e) => e.id)
      expect(new Set(ids).size).toBe(3)
      // Entries are prepended (unshift), so newest (highest ID) comes first
      expect(ids[0]).toBe('err-2')
      expect(ids[1]).toBe('err-1')
      expect(ids[2]).toBe('err-0')
    })
  })

  describe('LRU eviction (MAX_ENTRIES = 50)', () => {
    it('keeps at most 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        captureError(createEvent({ message: `error-${i}` }))
      }

      expect(getErrorCount()).toBe(50)
    })

    it('retains the most recent 50 entries (drops oldest)', () => {
      for (let i = 0; i < 55; i++) {
        captureError(createEvent({ message: `error-${i}` }))
      }

      const snapshot = getSnapshot()
      expect(snapshot).toHaveLength(50)

      // Most recent should be error-54, oldest retained should be error-5
      // (0-4 were evicted since 55 - 50 = 5 oldest are dropped)
      expect(snapshot[0].message).toBe('error-54')
      expect(snapshot[49].message).toBe('error-5')
    })

    it('survives exactly at capacity without eviction', () => {
      for (let i = 0; i < 50; i++) {
        captureError(createEvent({ message: `error-${i}` }))
      }

      expect(getErrorCount()).toBe(50)
      expect(getSnapshot()[49].message).toBe('error-0') // oldest retained
    })
  })

  describe('subscribe / getSnapshot (reactive pattern)', () => {
    it('subscribe returns an unsubscribe function', () => {
      const fn = () => {}
      const unsub = subscribe(fn)
      expect(unsub).toBeFunction()
      unsub()
    })

    it('notifies listener when captureError is called', () => {
      let called = false
      const unsub = subscribe(() => {
        called = true
      })

      captureError(createEvent())
      expect(called).toBe(true)
      unsub()
    })

    it('unsubscribed listener is not notified', () => {
      let callCount = 0
      const fn = () => { callCount++ }
      const unsub = subscribe(fn)
      unsub()

      captureError(createEvent())
      expect(callCount).toBe(0)
    })

    it('notifies all listeners on each capture', () => {
      let count1 = 0
      let count2 = 0
      const unsub1 = subscribe(() => { count1++ })
      const unsub2 = subscribe(() => { count2++ })

      captureError(createEvent())
      captureError(createEvent())

      expect(count1).toBe(2)
      expect(count2).toBe(2)

      unsub1()
      unsub2()
    })

    it('notifies on clearErrorHistory', () => {
      captureError(createEvent())

      let notified = false
      const unsub = subscribe(() => { notified = true })

      clearErrorHistory()
      expect(notified).toBe(true)
      unsub()
    })

    it('getSnapshot returns a stable reference between mutations (no infinite loop)', () => {
      captureError(createEvent())
      const a = getSnapshot()
      const b = getSnapshot()
      // SAME reference between renders — critical for useSyncExternalStore
      expect(a).toBe(b)
      expect(a).toEqual(b)

      // After a new mutation, a DIFFERENT reference is returned
      captureError(createEvent())
      const c = getSnapshot()
      expect(c).not.toBe(a)
    })

    it('getSnapshot array is detached from internal store (mutation-safe)', () => {
      captureError(createEvent())
      const snapshot = getSnapshot()
      ;(snapshot as ErrorHistoryEntry[]).length = 0 // mutate the snapshot
      expect(getErrorCount()).toBe(1) // internal store unaffected
    })

    it('getErrorCount returns the correct count', () => {
      expect(getErrorCount()).toBe(0)
      captureError(createEvent())
      expect(getErrorCount()).toBe(1)
      captureError(createEvent())
      expect(getErrorCount()).toBe(2)
    })
  })

  describe('clearErrorHistory', () => {
    it('removes all entries', () => {
      captureError(createEvent())
      captureError(createEvent())
      expect(getErrorCount()).toBe(2)

      clearErrorHistory()
      expect(getErrorCount()).toBe(0)
      expect(getSnapshot()).toHaveLength(0)
    })

    it('resets the ID counter', () => {
      captureError(createEvent())
      clearErrorHistory()

      captureError(createEvent())
      // After clear, nextId was reset to 0, so first entry after clear is err-0
      expect(getSnapshot()[0].id).toBe('err-0')
    })
  })

  describe('entry timestamps', () => {
    it('sets timestamp as a valid ISO string', () => {
      captureError(createEvent())
      const ts = getSnapshot()[0].timestamp
      expect(() => new Date(ts)).not.toThrow()
      expect(new Date(ts).toISOString()).toBe(ts)
    })

    it('sets relativeTime as a non-empty string', () => {
      captureError(createEvent())
      expect(getSnapshot()[0].relativeTime).toBeString()
      expect(getSnapshot()[0].relativeTime.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty events array (initial state)', () => {
      expect(getSnapshot()).toEqual([])
      expect(getErrorCount()).toBe(0)
    })

    it('survives clear on empty store', () => {
      clearErrorHistory()
      expect(getErrorCount()).toBe(0)
    })

    it('handles unsubscribing a listener that was already removed (no-op)', () => {
      const fn = () => {}
      const unsub = subscribe(fn)
      unsub() // first unsubscribe
      unsub() // second unsubscribe — should not throw
    })
  })
})

