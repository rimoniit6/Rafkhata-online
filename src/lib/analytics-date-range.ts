/**
 * Shared analytics date-range parser.
 *
 * Every analytics GET route historically inlined this ~10-line block to parse
 * `from`/`to`/`prevFrom`/`prevTo` query params (defaulting to a 30-day window
 * with a 60→30 day previous window for period-over-period comparison). This
 * helper is the single source of truth.
 *
 * Behaviour matches the legacy inline block exactly:
 *   - `to`/`prevTo` are extended to end-of-day (23:59:59.999Z)
 *   - `from`/`prevFrom` are kept at start-of-day (00:00:00 UTC)
 */

export interface AnalyticsDateRange {
  fromDate: Date
  toDate: Date
  prevFromDate: Date
  prevToDate: Date
}

const MS_PER_DAY = 86_400_000

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Parse the standard analytics query params into four Date bounds.
 *
 * Accepts either a `URLSearchParams` (from a Request) or a plain record
 * (e.g. the params object used when composing a cache key).
 */
export function parseAnalyticsDateRange(
  input: URLSearchParams | Record<string, string | undefined>,
): AnalyticsDateRange {
  const get = (key: string): string | null => {
    if (input instanceof URLSearchParams) return input.get(key)
    const val = input[key]
    return val ?? null
  }

  const from = get('from') || toDateString(new Date(Date.now() - 30 * MS_PER_DAY))
  const to = get('to') || toDateString(new Date())
  const prevFrom = get('prevFrom') || toDateString(new Date(Date.now() - 60 * MS_PER_DAY))
  const prevTo = get('prevTo') || toDateString(new Date(Date.now() - 30 * MS_PER_DAY))

  return {
    fromDate: new Date(from),
    toDate: new Date(to + 'T23:59:59.999Z'),
    prevFromDate: new Date(prevFrom),
    prevToDate: new Date(prevTo + 'T23:59:59.999Z'),
  }
}

