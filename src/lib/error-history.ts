/**
 * Dev-only error history store.
 *
 * Captures recent API errors with timestamps so the DevErrorPanel
 * can display them for debugging. Module-level singleton — survives
 * React re-renders but resets on page refresh.
 *
 * Uses a simple subscribe/notify pattern so React components can
 * reactively read the history via useSyncExternalStore.
 */
import type { ApiErrorEvent } from '@/lib/api-client'

// ====================================================================
// Types
// ====================================================================

export interface ErrorHistoryEntry {
  id: string
  timestamp: string
  relativeTime: string
  status: number
  code: string | undefined
  message: string
  endpoint: string
  method: string
  isRetryable: boolean
  details: unknown
}

// ====================================================================
// LRU store + subscription system
// ====================================================================

const MAX_ENTRIES = 50

const entries: ErrorHistoryEntry[] = []
let nextId = 0

const listeners = new Set<() => void>()

/*
 * Cached snapshot for useSyncExternalStore.
 *
 * IMPORTANT: This must be a stable reference between mutations so that
 * React's useSyncExternalStore does NOT trigger infinite re-renders.
 * Object.is(old, new) is used internally — returning a new array on
 * every call would cause React to detect a "change" every render.
 *
 * We only update this cache when entries actually mutate (captureError /
 * clearErrorHistory), and immediately freeze it (shallow) so getSnapshot()
 * returns the same array reference until the next mutation.
 */
let cachedSnapshot: readonly ErrorHistoryEntry[] = []

function updateCache(): void {
  cachedSnapshot = entries.slice()
}

function notify(): void {
  listeners.forEach((fn) => fn())
}

// ── Public API ───────────────────────────────────────────────────

export function captureError(event: ApiErrorEvent): void {
  const now = new Date()
  const entry: ErrorHistoryEntry = {
    id: `err-${nextId++}`,
    timestamp: now.toISOString(),
    relativeTime: formatRelativeTime(now),
    status: event.error.status,
    code: event.error.code,
    message: event.error.message,
    endpoint: event.error.endpoint,
    method: event.error.method,
    isRetryable: event.error.isRetryable,
    details: event.error.details,
  }

  entries.unshift(entry)

  // Trim oldest when over capacity
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES
  }

  updateCache()
  notify()
}

export function clearErrorHistory(): void {
  entries.length = 0
  nextId = 0
  updateCache()
  notify()
}

/**
 * Subscribe to history changes. Returns unsubscribe function.
 * Designed to be used with React's useSyncExternalStore.
 */
export function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/**
 * Snapshot function for useSyncExternalStore.
 *
 * Returns a STABLE reference (the cached array) that only changes when
 * captureError or clearErrorHistory is called. This is critical because
 * React's useSyncExternalStore compares snapshots via Object.is — if we
 * returned a new array on every call, React would detect a "change" each
 * render, causing an infinite re-render loop.
 */
export function getSnapshot(): readonly ErrorHistoryEntry[] {
  return cachedSnapshot
}

export function getErrorCount(): number {
  return entries.length
}

// ── Helpers ──────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()

  if (diff < 1_000) return 'এখনই'
  if (diff < 60_000) return `${Math.floor(diff / 1_000)}সে আগে`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}মি আগে`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}ঘ আগে`
  return `${Math.floor(diff / 86_400_000)}দ আগে`
}
