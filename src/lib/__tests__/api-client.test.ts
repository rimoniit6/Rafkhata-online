/// <reference types="bun-types" />

/**
 * Unit tests for ApiError class and ApiClient retry/request logic.
 *
 * Run with: bun test
 */

import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { ApiError, ApiClient, onApiError } from '@/lib/api-client'
import type { ApiErrorEvent } from '@/lib/api-client'
// Helper to create a fetch mock that satisfies Bun's fetch type (requires preconnect)
function mockFetch<T extends (...args: any[]) => any>(impl: T) {
  const m = mock(impl)
  return m as unknown as typeof globalThis.fetch
}

// ====================================================================
// ApiError
// ====================================================================

describe('ApiError', () => {
  it('creates an error with the given message and status', () => {
    const error = new ApiError('Not found', 404)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('ApiError')
    expect(error).toBeInstanceOf(Error)
  })

  it('sets default endpoint to empty string and method to GET', () => {
    const error = new ApiError('test', 500)
    expect(error.endpoint).toBe('')
    expect(error.method).toBe('GET')
  })

  it('accepts all optional properties via options', () => {
    const error = new ApiError('Server error', 500, {
      code: 'INTERNAL_ERROR',
      details: { traceId: 'abc-123' },
      endpoint: '/api/users',
      method: 'POST',
    })
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.details).toEqual({ traceId: 'abc-123' })
    expect(error.endpoint).toBe('/api/users')
    expect(error.method).toBe('POST')
  })

  describe('isRetryable', () => {
    it.each([
      [0, true],
      [429, true],
      [500, true],
      [502, true],
      [503, true],
      [504, true],
      [400, false],
      [401, false],
      [403, false],
      [404, false],
      [409, false],
      [422, false],
    ])('for status %i returns %s', (status, expected) => {
      expect(new ApiError('test', status).isRetryable).toBe(expected)
    })
  })
})

// ====================================================================
// ApiClient
// ====================================================================

describe('ApiClient', () => {
  let client: ApiClient
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    client = new ApiClient()
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  // ── Success path ───────────────────────────────────────────────

  describe('basic request', () => {
    it('sends a GET request and returns parsed JSON', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: 1, name: 'Alice' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const result = await client.get<{ id: number; name: string }>('/api/users')
      expect(result).toEqual({ id: 1, name: 'Alice' })
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('prepends /api/ to relative endpoints', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.get('users')
      const url = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][0]
      expect(url).toBe('/api/users')
    })

    it('leaves absolute URLs unchanged', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.get('https://external.com/api/data')
      const url = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][0]
      expect(url).toBe('https://external.com/api/data')
    })

    it('appends query parameters', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.get('/api/users', { page: 1, limit: 20 })
      const url = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][0] as string
      expect(url).toContain('page=1')
      expect(url).toContain('limit=20')
    })

    it('skips undefined, null, and empty query params', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.get('/api/users', { page: 1, name: undefined, filter: null, tag: '' })
      const url = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][0] as string
      expect(url).toContain('page=1')
      expect(url).not.toContain('name=')
      expect(url).not.toContain('filter=')
      expect(url).not.toContain('tag=')
    })

    it('sends POST with JSON body', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({ id: 1 }), { status: 201, headers: { 'Content-Type': 'application/json' } })),
      )

      const result = await client.post<{ id: number }>('/api/users', { name: 'Bob' })
      expect(result).toEqual({ id: 1 })

      const call = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0]
      expect(call[1].method).toBe('POST')
      expect(call[1].body).toBe(JSON.stringify({ name: 'Bob' }))
    })

    it('sets Content-Type: application/json by default via singleton interceptor', async () => {
      // Register the same Content-Type interceptor used by the singleton `api`.
      // On a fresh client instance, interceptors aren't registered automatically.
      client.onRequest((config) => {
        const headers = new Headers(config.headers || {})
        if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
          headers.set('Content-Type', 'application/json')
        }
        config.headers = headers
        return config
      })

      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.post('/api/test', { foo: 'bar' })
      const headers = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][1].headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('sets correct method for DELETE', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      await client.delete('/api/users/1')
      const method = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][1].method
      expect(method).toBe('DELETE')
    })
  })

  // ── Retry behavior ─────────────────────────────────────────────

  describe('retry behavior', () => {
    it('does not retry on a successful response', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      await client.get('/api/test', undefined, { retries: 2 })
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('retries on 5xx and succeeds on retry', async () => {
      let count = 0
      global.fetch = mockFetch(() => {
        count++
        if (count === 1) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: 'Server error' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }),
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify({ data: 'recovered' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      })

      const result = await client.get<{ data: string }>('/api/test', undefined, { retries: 1, retryDelay: 10 })
      expect(result).toEqual({ data: 'recovered' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it.each([400, 401, 403, 404, 409, 422])('does NOT retry on %i client error', async (status) => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Client error' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      await expect(client.get('/api/test', undefined, { retries: 2, retryDelay: 10 })).rejects.toThrow(ApiError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('exhausts all retries and throws the last error', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const error = await client
        .get('/api/test', undefined, { retries: 2, retryDelay: 10 })
        .catch((e: unknown) => e) as ApiError

      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(500)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('retries on network error (fetch throws)', async () => {
      let count = 0
      global.fetch = mockFetch(() => {
        count++
        if (count === 1) return Promise.reject(new TypeError('Failed to fetch'))
        return Promise.resolve(
          new Response(JSON.stringify({ data: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      })

      const result = await client.get('/api/test', undefined, { retries: 1, retryDelay: 10 })
      expect(result).toEqual({ data: 'ok' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('counts retries against maxRetries (not total attempts)', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      await expect(client.get('/api/test', undefined, { retries: 0, retryDelay: 10 })).rejects.toThrow(ApiError)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('sets NETWORK_ERROR code on fetch rejection errors', async () => {
      global.fetch = mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))

      const error = await client
        .get('/api/test', undefined, { retries: 0 })
        .catch((e: unknown) => e) as ApiError

      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(0)
      expect(error.code).toBe('NETWORK_ERROR')
    })

    it('includes endpoint and method in the thrown error', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const error = await client
        .post('/api/users', { name: 'test' }, { retries: 0 })
        .catch((e: unknown) => e) as ApiError

      expect(error.endpoint).toContain('/api/users')
      expect(error.method).toBe('POST')
    })
  })

  // ── Timeout ────────────────────────────────────────────────────

  describe('timeout', () => {
    it('throws ApiError with REQUEST_TIMEOUT when request exceeds timeout', async () => {
      // Mock fetch that listens to the abort signal and rejects when timeout fires
      global.fetch = mockFetch((_url: string, opts: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = opts.signal
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'))
            })
          }
        })
      })

      const error = await client
        .get('/api/test', undefined, { timeout: 50, retries: 0 })
        .catch((e: unknown) => e) as ApiError

      expect(error).toBeInstanceOf(ApiError)
      expect(error.code).toBe('REQUEST_TIMEOUT')
      expect(error.status).toBe(0)
    })
  })

  // ── Global error events ────────────────────────────────────────

  describe('onApiError (global event system)', () => {
    it('emits an ApiErrorEvent on HTTP error responses', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const events: ApiErrorEvent[] = []
      const unsub = onApiError((evt) => events.push(evt))

      await client.get('/api/test', undefined, { retries: 0 }).catch(() => {})

      expect(events).toHaveLength(1)
      expect(events[0].error.status).toBe(404)
      expect(events[0].error.message).toBe('Not found')

      unsub()
    })

    it('does NOT emit when silent: true', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const events: ApiErrorEvent[] = []
      const unsub = onApiError((evt) => events.push(evt))

      await client.get('/api/test', undefined, { retries: 0, silent: true }).catch(() => {})

      expect(events).toHaveLength(0)
      unsub()
    })

    it('unsubscribe removes the listener', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const events: ApiErrorEvent[] = []
      const unsub = onApiError((evt) => events.push(evt))
      unsub()

      await client.get('/api/test', undefined, { retries: 0 }).catch(() => {})

      expect(events).toHaveLength(0)
    })
  })

  // ── Interceptors ───────────────────────────────────────────────

  describe('interceptors', () => {
    it('request interceptor can modify headers', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      const unsub = client.onRequest((config) => {
        const headers = new Headers(config.headers)
        headers.set('X-Custom', 'test-value')
        config.headers = headers
        return config
      })

      await client.get('/api/test')

      const headers = (global.fetch as unknown as ReturnType<typeof mock>).mock.calls[0][1].headers
      expect(headers.get('X-Custom')).toBe('test-value')
      unsub()
    })

    it('response interceptor can transform data', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: 1, name: 'Alice' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      const unsub = client.onResponse((_res, data) => {
        const d = data as Record<string, unknown>
        return { ...d, extra: true }
      })

      const result = await client.get<{ id: number; extra: boolean }>('/api/test')
      expect(result.extra).toBe(true)
      unsub()
    })

    it('multiple interceptors run in registration order', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      const order: string[] = []

      client.onRequest(async (c) => {
        order.push('req1')
        return c
      })
      client.onRequest(async (c) => {
        order.push('req2')
        return c
      })
      client.onResponse(async (r, d) => {
        order.push('res1')
        return d
      })
      client.onResponse(async (r, d) => {
        order.push('res2')
        return d
      })

      await client.get('/api/test')
      expect(order).toEqual(['req1', 'req2', 'res1', 'res2'])
    })

    it('request interceptor unsubscribe works', async () => {
      global.fetch = mockFetch(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })),
      )

      let called = false
      const unsub = client.onRequest((c) => {
        called = true
        return c
      })
      unsub()

      await client.get('/api/test')
      expect(called).toBe(false)
    })
  })

  // ── Defaults ───────────────────────────────────────────────────

  describe('setDefaults', () => {
    it('merges with existing defaults', async () => {
      client.setDefaults({ retries: 2, retryDelay: 10 })

      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      await client.get('/api/test').catch(() => {})
      // With retries: 2 → 3 total attempts (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('per-call options override defaults', async () => {
      client.setDefaults({ retries: 2, retryDelay: 10 })

      global.fetch = mockFetch(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      )

      // Per-call retries: 0 overrides default retries: 2
      await client.get('/api/test', undefined, { retries: 0 }).catch(() => {})
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})

