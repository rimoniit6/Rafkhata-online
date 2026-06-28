export function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)) {
    const nested = (data as Record<string, unknown>).data
    if (Array.isArray(nested)) return nested as T[]
  }
  return []
}

export function safeData<T>(response: unknown, fallback: T | null = null): T | null {
  if (!response || typeof response !== 'object') return fallback
  const r = response as Record<string, unknown>
  if (r.success === true && 'data' in r) {
    const d = r.data
    if (d !== null && d !== undefined) return d as T
  }
  return fallback
}

export function resolveApiData<T>(json: Record<string, unknown>, fallback: T[] = []): T[] {
  if (json.success === true) {
    const d = json.data
    if (Array.isArray(d)) return d as T[]
    if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
      const nested = (d as Record<string, unknown>).data
      if (Array.isArray(nested)) return nested as T[]
    }
    if (d && typeof d === 'object') {
      const nested = d as Record<string, unknown>
      for (const key of ['data', 'items', 'records', 'results', 'mcqs', 'cqs', 'lectures', 'questions', 'users', 'payments', 'classes', 'subjects', 'chapters', 'boards', 'banners', 'testimonials', 'faqs', 'content', 'packages', 'sets']) {
        if (key in nested && Array.isArray(nested[key])) {
          return nested[key] as T[]
        }
      }
    }
  }
  if (Array.isArray(json.data)) return json.data as T[]
  if (json.data && typeof json.data === 'object') {
    const d = json.data as Record<string, unknown>
    for (const key of ['data', 'items', 'records', 'results', 'mcqs', 'cqs', 'lectures', 'questions', 'users', 'payments', 'classes', 'subjects', 'chapters', 'boards', 'banners', 'testimonials', 'faqs', 'content', 'packages', 'sets']) {
      if (key in d && Array.isArray(d[key])) {
        return d[key] as T[]
      }
    }
  }
  return fallback
}

export function safePagination(json: Record<string, unknown>): { page: number; limit: number; total: number; totalPages: number } | undefined {
  if (json.pagination && typeof json.pagination === 'object') {
    return json.pagination as { page: number; limit: number; total: number; totalPages: number }
  }
  const d = json.data
  if (d && typeof d === 'object' && 'pagination' in (d as Record<string, unknown>)) {
    const p = (d as Record<string, unknown>).pagination
    if (p && typeof p === 'object') {
      return p as { page: number; limit: number; total: number; totalPages: number }
    }
  }
  return undefined
}
