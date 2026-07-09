type SuggestionCacheItem = {
  id: string
}

let suggestionsCache: SuggestionCacheItem[] = []

export function setSuggestionsCache<T extends SuggestionCacheItem>(suggestions: T[]) {
  suggestionsCache = suggestions
}

export function getSuggestionFromCache<T extends SuggestionCacheItem = SuggestionCacheItem>(id: string): T | undefined {
  return suggestionsCache.find(s => s.id === id) as T | undefined
}
