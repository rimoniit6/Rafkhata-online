export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`সার্ভার ত্রুটি: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`প্রত্যাশিত JSON পাওয়া যায়নি, পাওয়া গেছে: ${contentType || 'অজানা'}`)
  }

  return res.json() as Promise<T>
}
