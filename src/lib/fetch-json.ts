export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    // Try to parse error response body for a better error message
    try {
      const errBody = await res.json()
      if (errBody?.error) {
        throw new Error(errBody.error)
      }
    } catch (e) {
      if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
        throw e // re-throw if it's our custom error
      }
      // Fall through to default error message
    }
    throw new Error(`সার্ভার ত্রুটি: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`প্রত্যাশিত JSON পাওয়া যায়নি, পাওয়া গেছে: ${contentType || 'অজানা'}`)
  }

  const json = await res.json()

  // Auto-unwrap { success, data, pagination } envelope - consistent with api-client interceptor
  if (typeof json === 'object' && json !== null && 'success' in json && 'data' in json) {
    if (json.success === true) {
      const payload = json.data
      const pagination = json.pagination

      // Array data with pagination → preserve { data, pagination } shape
      if (pagination && Array.isArray(payload)) {
        return { data: payload, pagination } as unknown as T
      }

      return payload as T
    }

    // Error response (success: false)
    throw new Error(json.error || 'অনুরোধ ব্যর্থ হয়েছে')
  }

  return json as T
}
