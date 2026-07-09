/**
 * Shared admin hook utilities — eliminates duplicate logic across
 * course, MCQ, and CQ exam admin hooks.
 */

/** Extract error message from any thrown value */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return fallback
}

/** Unwrap the { success, data } API envelope */
export function unwrap<T = unknown>(response: unknown): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data?: T }).data ?? (response as T)
  }
  return response as T
}

/**
 * Create an AbortController + generation counter for race-condition-safe fetching.
 *
 * Usage:
 *   const { signal, gen, isStale } = raceGuard.next()
 *   if (isStale) return  // a newer request already started
 *   try { await fetch(..., { signal }) } catch { if (!isStale) throw }
 *
 * When the component unmounts, call `raceGuard.dispose()` in a useEffect cleanup.
 */
export function createRaceGuard() {
  let generation = 0
  let currentController: AbortController | null = null

  return {
    /** Start a new request, aborting any prior in-flight one. Returns the signal + staleness check. */
    next() {
      currentController?.abort()
      const gen = ++generation
      const controller = new AbortController()
      currentController = controller
      return {
        signal: controller.signal,
        gen,
        /** Call after await to check if a newer request superseded this one */
        isStale: () => generation !== gen,
      }
    },
    /** Abort any in-flight request (call in useEffect cleanup) */
    dispose() {
      currentController?.abort()
      currentController = null
    },
    /** Current generation number */
    get generation() { return generation },
  }
}
