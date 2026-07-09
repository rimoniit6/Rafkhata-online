/**
 * Centralized file URL resolver.
 *
 * Converts relative paths (e.g. `/uploads/file.jpg`) to absolute URLs
 * using the current origin (browser) or NEXT_PUBLIC_SITE_URL (server).
 *
 * Usage:
 *   getFileUrl('/uploads/abc.jpg')          → 'https://domain.com/uploads/abc.jpg'
 *   getFileUrl('https://cdn.com/img.jpg')   → 'https://cdn.com/img.jpg'
 *   getFileUrl(null)                         → ''
 *   getFileUrl('')                            → ''
 */

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#f1f5f9" width="400" height="300"/>
      <text x="200" y="145" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">ছবি লোড হয়নি</text>
    </svg>`,
  )

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Server-side — use env var or fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/**
 * Normalize an absolute URL that points to localhost — extract its pathname
 * so it can be re-resolved against the current domain.
 * This handles legacy records where the upload API stored absolute URLs
 * like `http://localhost:3000/uploads/file.jpg`.
 */
function normalizeLocalhostUrl(path: string): string | null {
  try {
    const parsed = new URL(path)
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0'
    ) {
      return parsed.pathname + parsed.search
    }
  } catch {
    // Not a valid URL — return null to fall through
  }
  return null
}

/**
 * Resolve a file path to an absolute URL.
 * - If already absolute (http/https) and NOT localhost, returns as-is.
 * - If absolute but points to localhost, strips the origin and re-resolves.
 * - If relative (e.g. /uploads/file.jpg), prepends the base URL.
 * - If null/undefined/empty, returns ''.
 */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return ''
  // Normalize absolute localhost URLs back to relative paths
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const normalized = normalizeLocalhostUrl(path)
    if (normalized !== null) {
      return `${getBaseUrl()}${normalized}`
    }
    return path
  }
  // Handle protocol-relative URLs (//cdn.com/file.jpg)
  if (path.startsWith('//')) return `https:${path}`
  // Ensure path starts with /
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getBaseUrl()}${normalized}`
}

/**
 * Returns a data-URI placeholder for broken/missing images.
 */
export function getImagePlaceholder(): string {
  return PLACEHOLDER
}
