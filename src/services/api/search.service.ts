import { api } from '@/lib/api-client'

export interface SearchResults {
  query: string
  results: Record<string, unknown[]>
  total: number
}

export const searchService = {
  search: (q: string, type?: string, limit?: number) =>
    api.get<SearchResults>('search', { q, ...(type && { type }), ...(limit && { limit }) }),
}
