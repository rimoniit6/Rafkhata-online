// Bangladesh Standard Time (BST) is UTC+6
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000

/**
 * Returns the current absolute epoch ms for Dhaka time calculations.
 * All comparisons use absolute epoch ms, which is timezone-agnostic.
 */
export function getDhakaOffsetMs(): number {
  return DHAKA_OFFSET_MS
}

/**
 * Convert a scheduledDate (stored as UTC midnight) + time string (HH:mm in BD)
 * to absolute epoch ms for comparison with Date.now().
 *
 * scheduledDate is stored as UTC midnight (new Date("YYYY-MM-DD") in JS),
 * so we subtract BD offset to get BD midnight, then add BD time.
 */
export function getExamTimeMs(
  scheduledDate: Date,
  timeStr: string
): number {
  const [h, m] = timeStr.split(':').map(Number)
  return scheduledDate.getTime() - DHAKA_OFFSET_MS + h * 3600000 + m * 60000
}

/**
 * Get the BD midnight (start of day in BD) for a given UTC-midnight Date.
 */
export function getDhakaDayMs(scheduledDate: Date): number {
  return scheduledDate.getTime() - DHAKA_OFFSET_MS
}

/**
 * Get the current date components in BD timezone (as a simple object).
 */
export function getDhakaNow(): { year: number; month: number; day: number; hours: number; minutes: number; epochMs: number } {
  const now = Date.now()
  const dhakaMs = now + DHAKA_OFFSET_MS
  const d = new Date(dhakaMs)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    epochMs: now,
  }
}
