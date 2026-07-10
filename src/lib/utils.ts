import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Arabic numerals (0-9) to Bengali numerals (০-৯).
 * Accepts number or string, always returns a string with Bengali digits.
 */
export function toBengaliNumerals(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)])
}

// ─── Shared Duplicated Utilities ────────────────────────────────

/**
 * Generate a URL-safe slug from a string (supports Bengali characters).
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Map a percentage score to a Bengali grade letter and color class.
 */
export function getGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600' }
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-500' }
  if (percentage >= 70) return { grade: 'A-', color: 'text-teal-500' }
  if (percentage >= 60) return { grade: 'B', color: 'text-cyan-500' }
  if (percentage >= 50) return { grade: 'C', color: 'text-amber-500' }
  if (percentage >= 40) return { grade: 'D', color: 'text-orange-500' }
  return { grade: 'F', color: 'text-destructive' }
}

/** Bengali labels for difficulty levels. */
export const difficultyLabels: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
}

/** Tailwind color classes for difficulty badges. */
export const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}
