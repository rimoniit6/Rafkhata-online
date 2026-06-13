/**
 * Production-grade API client for the Sikkha platform.
 *
 * Features:
 * - Request/response interceptors
 * - Structured ApiError with status/code/details/isRetryable
 * - Retry with exponential backoff for network & 5xx errors
 * - Configurable timeout via AbortController
 * - Global error event emitter for toast/logging
 * - Flexible method shorthands (get/post/put/patch/delete)
 *
 * Auth is cookie-based (httpOnly cookie), so no manual token
 * management is needed — the browser sends the cookie automatically.
 */

// ====================================================================
// Types
// ====================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  /** Request timeout in milliseconds. Default: 30_000. Set to 0 to disable. */
  timeout?: number
  /** Number of retry attempts for retryable failures. Default: 0 */
  retries?: number
  /** Base delay between retries in ms (doubles each attempt). Default: 1000 */
  retryDelay?: number
  /** Skip the global error event for this request. Error is still thrown. */
  silent?: boolean
}

export type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>

export type ResponseInterceptor = (
  response: Response,
  data: unknown,
  config: RequestConfig,
) => unknown | Promise<unknown>

export interface ApiErrorEvent {
  error: ApiError
  endpoint: string
  method: string
  config: RequestConfig
}

// ====================================================================
// ApiError – structured error for the client side
// ====================================================================

export class ApiError extends Error {
  public readonly status: number
  public readonly code: string | undefined
  public readonly details: unknown
  public readonly isRetryable: boolean
  public readonly endpoint: string
  public readonly method: string

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string
      details?: unknown
      endpoint?: string
      method?: string
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = options?.code
    this.details = options?.details
    this.endpoint = options?.endpoint ?? ''
    this.method = options?.method ?? 'GET'

    // Network errors (0), server errors (5xx), and rate-limits (429) are retryable
    this.isRetryable =
      status === 0 ||
      status === 429 ||
      (status >= 500 && status < 600)
  }
}

// ====================================================================
// Global error event system
// ====================================================================

type ErrorListener = (event: ApiErrorEvent) => void

const errorListeners = new Set<ErrorListener>()

/**
 * Subscribe to all API errors globally (useful for toast notifications).
 * Returns an unsubscribe function.
 *
 * @example
 * ```ts
 * useEffect(() => onApiError(({ error, endpoint }) => {
 *   toast({ title: error.message, variant: 'destructive' })
 * }), [])
 * ```
 */
export function onApiError(listener: ErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

function emitApiError(event: ApiErrorEvent) {
  errorListeners.forEach((fn) => fn(event))
}

// ====================================================================
// Default request interceptor: Content-Type header
// ====================================================================

const contentTypeInterceptor: RequestInterceptor = (config) => {
  const headers = new Headers(config.headers || {})
  if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  config.headers = headers
  return config
}

// ====================================================================
// Retry helper
// ====================================================================

const RETRYABLE_STATUSES = new Set([0, 408, 429, 502, 503, 504])

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false
  return RETRYABLE_STATUSES.has(error.status) || error.isRetryable
}

function calculateBackoff(attempt: number, baseDelay: number): number {
  // Exponential backoff with jitter: base * 2^attempt + random(0, 1000)
  return baseDelay * Math.pow(2, attempt) + Math.random() * 1000
}

// ====================================================================
// AbortSignal combiner (internal)
// ====================================================================

function combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  if (signal1.aborted) return signal1
  if (signal2.aborted) return signal2

  const controller = new AbortController()

  const cleanup = () => {
    signal1.removeEventListener('abort', onAbort1)
    signal2.removeEventListener('abort', onAbort2)
  }

  const onAbort1 = () => {
    cleanup()
    controller.abort(signal1.reason)
  }
  const onAbort2 = () => {
    cleanup()
    controller.abort(signal2.reason)
  }

  signal1.addEventListener('abort', onAbort1, { once: true })
  signal2.addEventListener('abort', onAbort2, { once: true })

  return controller.signal
}

// ====================================================================
// ApiClient
// ====================================================================

export class ApiClient {
  private readonly requestInterceptors: RequestInterceptor[] = []
  private readonly responseInterceptors: ResponseInterceptor[] = []

  /** Default config applied to every request */
  private defaults: Partial<RequestConfig> = {
    timeout: 30_000,
    retries: 0,
    retryDelay: 1000,
  }

  // ── Interceptor registration ──────────────────────────────────

  /** Register a request interceptor (runs before every request). Returns an unsubscribe fn. */
  onRequest(fn: RequestInterceptor): () => void {
    this.requestInterceptors.push(fn)
    return () => {
      const idx = this.requestInterceptors.indexOf(fn)
      if (idx !== -1) this.requestInterceptors.splice(idx, 1)
    }
  }

  /**
   * Register a response interceptor (runs after every successful response, before the promise resolves).
   * The interceptor receives `(response, data, config)` and should return the (possibly transformed) data.
   * Returns an unsubscribe fn.
   *
   * @example
   * ```ts
   * api.onResponse((response, data) => {
   *   // Auto-unwrap { success, data } format if needed
   *   if (typeof data === 'object' && data !== null && 'success' in data && 'data' in data) {
   *     return data.data
   *   }
   *   return data
   * })
   * ```
   */
  onResponse(fn: ResponseInterceptor): () => void {
    this.responseInterceptors.push(fn)
    return () => {
      const idx = this.responseInterceptors.indexOf(fn)
      if (idx !== -1) this.responseInterceptors.splice(idx, 1)
    }
  }

  /** Configure defaults applied to every request. */
  setDefaults(defaults: Partial<RequestConfig>): void {
    this.defaults = { ...this.defaults, ...defaults }
  }

  // ── Core request method ───────────────────────────────────────

  async request<T>(
    endpoint: string,
    options: RequestConfig = {},
  ): Promise<T> {
    // Merge defaults with per-call options
    const config: RequestConfig = { ...this.defaults, ...options }

    // Build URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : endpoint.startsWith('/')
        ? endpoint
        : `/api/${endpoint}`

    // Append query params
    let fullUrl = url
    if (config.params) {
      const searchParams = new URLSearchParams()
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const qs = searchParams.toString()
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs
      }
    }

    const method = (config.method || 'GET').toUpperCase()

    // ── Run request interceptors ─────────────────────────
    let interceptorConfig = config
    for (const interceptor of this.requestInterceptors) {
      interceptorConfig = await interceptor(interceptorConfig)
    }

    const timeoutMs = interceptorConfig.timeout ?? 30_000
    let lastError: ApiError | null = null

    // ── Retry loop (per-attempt timeout) ─────────────────
    const maxRetries = interceptorConfig.retries ?? 0
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Create a FRESH AbortController per attempt so a timeout on one
      // attempt doesn't poison subsequent retries.
      const abortController = new AbortController()
      const timeoutId =
        timeoutMs > 0
          ? setTimeout(() => abortController.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs)
          : undefined

      // Merge the external abort signal (if any) with this attempt's timeout signal
      const combinedSignal = interceptorConfig.signal
        ? combineSignals(interceptorConfig.signal, abortController.signal)
        : abortController.signal

      const fetchOptions: RequestInit = {
        method: interceptorConfig.method,
        headers: interceptorConfig.headers,
        body: interceptorConfig.body,
        cache: interceptorConfig.cache,
        credentials: interceptorConfig.credentials,
        mode: interceptorConfig.mode,
        redirect: interceptorConfig.redirect,
        referrer: interceptorConfig.referrer,
        referrerPolicy: interceptorConfig.referrerPolicy,
        integrity: interceptorConfig.integrity,
        keepalive: interceptorConfig.keepalive,
        window: interceptorConfig.window,
        signal: combinedSignal,
      }

      try {
        const response = await fetch(fullUrl, fetchOptions)

        // Parse response body
        let data: unknown
        const contentTypeHeader = response.headers.get('content-type') ?? ''
        if (contentTypeHeader.includes('application/json')) {
          try {
            data = await response.json()
          } catch {
            // Body claimed JSON but wasn't — fall back to text to preserve the status
            data = { error: await response.text().catch(() => 'Invalid JSON response') }
          }
        } else {
          const text = await response.text()
          data = text || null
        }

        // ── Run response interceptors ──────────────────
        let processedData = data
        for (const interceptor of this.responseInterceptors) {
          processedData = await interceptor(response, processedData, interceptorConfig)
        }

        if (!response.ok) {
          const errData = (processedData as any) ?? (data as any) ?? {}
          const apiError = new ApiError(
            errData.error || errData.message || `অনুরোধ ব্যর্থ হয়েছে (${response.status})`,
            response.status,
            {
              code: errData.code,
              details: errData.details,
              endpoint: fullUrl,
              method,
            },
          )

          lastError = apiError

          if (shouldRetry(apiError, attempt, maxRetries)) {
            const delay = calculateBackoff(attempt, interceptorConfig.retryDelay ?? 1000)
            await sleep(delay)
            continue
          }

          // Emit global error event unless silent
          if (!interceptorConfig.silent) {
            emitApiError({
              error: apiError,
              endpoint: fullUrl,
              method,
              config: interceptorConfig,
            })
          }

          throw apiError
        }

        return processedData as T
      } catch (err) {
        // ── Non-HTTP errors (network, timeout, abort) ──
        if (err instanceof ApiError) {
          lastError = err
          if (shouldRetry(err, attempt, maxRetries)) {
            const delay = calculateBackoff(attempt, interceptorConfig.retryDelay ?? 1000)
            await sleep(delay)
            continue
          }
          // Already emitted above if not silent
          throw err
        }

        // Handle AbortError / TimeoutError
        if (err instanceof DOMException && err.name === 'AbortError') {
          const timeoutMsg = err.message === 'Request timeout'
            ? `অনুরোধ সময়সীমা অতিক্রম করেছে (${timeoutMs}ms)`
            : 'অনুরোধ বাতিল করা হয়েছে'
          const apiError = new ApiError(timeoutMsg, 0, {
            code: 'REQUEST_TIMEOUT',
            endpoint: fullUrl,
            method,
          })

          if (shouldRetry(apiError, attempt, maxRetries)) {
            const delay = calculateBackoff(attempt, interceptorConfig.retryDelay ?? 1000)
            await sleep(delay)
            continue
          }

          if (!interceptorConfig.silent) {
            emitApiError({ error: apiError, endpoint: fullUrl, method, config: interceptorConfig })
          }
          throw apiError
        }

        // Network error (fetch threw without a response)
        const networkError = new ApiError(
          err instanceof Error ? err.message : 'নেটওয়ার্ক ত্রুটি — সংযোগ পরীক্ষা করুন',
          0,
          { code: 'NETWORK_ERROR', endpoint: fullUrl, method },
        )

        if (shouldRetry(networkError, attempt, maxRetries)) {
          const delay = calculateBackoff(attempt, interceptorConfig.retryDelay ?? 1000)
          await sleep(delay)
          continue
        }

        if (!interceptorConfig.silent) {
          emitApiError({
            error: networkError,
            endpoint: fullUrl,
            method,
            config: interceptorConfig,
          })
        }
        throw networkError
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId)
      }
    }

    // All retries exhausted
    throw lastError ?? new ApiError('সর্বোচ্চ পুনরায় চেষ্টা সীমা অতিক্রম করেছে', 0, {
      code: 'MAX_RETRIES_EXCEEDED',
      endpoint: fullUrl,
      method,
    })
  }

  // ── HTTP method shorthands ────────────────────────────────────

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET', params })
  }

  post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE', params })
  }
}

// ====================================================================
// Singleton instance (pre-configured)
// ====================================================================

export const api = new ApiClient()

// Register default request interceptor: auto-set Content-Type
api.onRequest(contentTypeInterceptor)

// Auth in this project is cookie-based (httpOnly cookie set by the server).
// No Authorization header is needed — the browser sends the cookie
// automatically on every request. If token-based auth is adopted in the
// future, register a new interceptor:
//
//   api.onRequest(async (config) => {
//     const token = getTokenFromStore()
//     if (token) {
//       const headers = new Headers(config.headers)
//       headers.set('Authorization', `Bearer ${token}`)
//       config.headers = headers
//     }
//     return config
//   })

// Register response interceptor: auto-unwrap { success, data, pagination } envelope.
// This is the standard response format for all API routes.
// - Object data: returned directly (pagination merged if present)
// - Array data with pagination: returned as { data: array, pagination }
// - Array data without pagination: returned as bare array
// - Error responses (success=false): passed through unchanged
api.onResponse((_response, data) => {
  if (typeof data === 'object' && data !== null && 'success' in data && 'data' in data) {
    const env = data as Record<string, unknown>
    if (env.success === true) {
      const payload = env.data
      const pagination = env.pagination

      // Array data with pagination → wrap in { data, pagination }
      if (pagination && Array.isArray(payload)) {
        return { data: payload, pagination }
      }

      // Object data with pagination → merge pagination into object
      if (pagination && typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
        return { ...(payload as Record<string, unknown>), pagination }
      }

      // Everything else → return data directly
      return payload
    }
  }
  return data
})
