import { db } from '@/lib/db'

// ─── Server-side label resolution utilities ────────────────────
// Used by API routes that need class/board label maps but can't use React hooks

let cachedClassLabelMap: Record<string, string> | null = null
let cachedBoardLabelMap: Record<string, string> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function ensureCache() {
  if (cachedClassLabelMap && cachedBoardLabelMap && Date.now() - cacheTimestamp < CACHE_TTL) {
    return
  }

  const [classes, boards] = await Promise.all([
    db.classCategory.findMany({ where: { isActive: true }, select: { slug: true, name: true } }),
    db.board.findMany({ where: { isActive: true }, select: { slug: true, name: true } }),
  ])

  cachedClassLabelMap = Object.fromEntries(classes.map(c => [c.slug, c.name]))
  cachedBoardLabelMap = Object.fromEntries(boards.map(b => [b.slug, b.name]))
  cacheTimestamp = Date.now()
}

/**
 * Get a map of class slug → Bengali label (server-side)
 * Example: { 'class-6': '৬ষ্ঠ শ্রেণি', 'ssc': 'এসএসসি' }
 */
export async function getServerClassLabelMap(): Promise<Record<string, string>> {
  await ensureCache()
  return cachedClassLabelMap!
}

/**
 * Get a map of board slug → Bengali label (server-side)
 * Example: { 'dhaka': 'ঢাকা', 'rajshahi': 'রাজশাহী' }
 */
export async function getServerBoardLabelMap(): Promise<Record<string, string>> {
  await ensureCache()
  return cachedBoardLabelMap!
}

/**
 * Resolve a single class slug to its Bengali label (server-side)
 */
export async function resolveClassLabel(slug: string): Promise<string> {
  const map = await getServerClassLabelMap()
  return map[slug] || slug
}

/**
 * Resolve a single board slug to its Bengali label (server-side)
 */
export async function resolveBoardLabel(slug: string): Promise<string> {
  const map = await getServerBoardLabelMap()
  return map[slug] || slug
}

/**
 * Invalidate the server-side cache (e.g., after admin updates)
 */
export function invalidateServerHierarchyCache() {
  cachedClassLabelMap = null
  cachedBoardLabelMap = null
  cacheTimestamp = 0
}

// ─── Fallback maps (used only when DB is empty/unavailable) ─────

export const FALLBACK_CLASS_LABELS: Record<string, string> = {
  'class-6': '৬ষ্ঠ শ্রেণি',
  'class-7': '৭ম শ্রেণি',
  'class-8': '৮ম শ্রেণি',
  'ssc': 'এসএসসি',
  'hsc': 'এইচএসসি',
}

export const FALLBACK_BOARD_LABELS: Record<string, string> = {
  'dhaka': 'ঢাকা',
  'rajshahi': 'রাজশাহী',
  'chittagong': 'চট্টগ্রাম',
  'sylhet': 'সিলেট',
  'barishal': 'বরিশাল',
  'comilla': 'কুমিল্লা',
  'jessore': 'যশোর',
  'dinajpur': 'দিনাজপুর',
  'mymensingh': 'ময়মনসিংহ',
  'tangail': 'টাঙ্গাইল',
}

export const FALLBACK_SLUG_GRADIENTS: Record<string, string> = {
  'class-6': 'from-emerald-400 to-emerald-600',
  'class-7': 'from-teal-400 to-teal-600',
  'class-8': 'from-cyan-400 to-cyan-600',
  'ssc': 'from-emerald-500 to-teal-500',
  'hsc': 'from-teal-500 to-emerald-500',
}
