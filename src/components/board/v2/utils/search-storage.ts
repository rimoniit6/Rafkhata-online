const STORAGE_KEY = 'board-q-recent-searches'
const MAX_RECENT = 5

export function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveRecentSearch(current: string[], query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return current
  const updated = [trimmed, ...current.filter((s) => s !== trimmed)].slice(0, MAX_RECENT)
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {
    // localStorage unavailable (incognito, storage full) — silently degrade
  }
  return updated
}

export function removeRecentSearch(current: string[], query: string): string[] {
  const updated = current.filter((s) => s !== query)
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {
    // localStorage unavailable (incognito, storage full) — silently degrade
  }
  return updated
}
