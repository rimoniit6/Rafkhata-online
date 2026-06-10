let suggestionsCache: any[] = []

export function setSuggestionsCache(suggestions: any[]) {
  suggestionsCache = suggestions
}

export function getSuggestionFromCache(id: string) {
  return suggestionsCache.find(s => s.id === id)
}
