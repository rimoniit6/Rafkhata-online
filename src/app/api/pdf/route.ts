import { apiError } from '@/lib/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'

/**
 * Check if a hostname resolves to a private/internal IP address
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return false

  // Loopback: 127.0.0.0/8
  if (parts[0] === 127) return true
  // Private: 10.0.0.0/8
  if (parts[0] === 10) return true
  // Private: 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  // Private: 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true
  // Link-local: 169.254.0.0/16
  if (parts[0] === 169 && parts[1] === 254) return true
  // Broadcast: 0.0.0.0
  if (parts[0] === 0) return true

  return false
}

/**
 * Check if a URL is safe to fetch (not internal/private)
 */
function isUrlSafe(url: URL): boolean {
  const hostname = url.hostname.toLowerCase()

  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    return false
  }

  // Block if hostname is a raw IP that's private
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isPrivateIP(hostname)) return false
  }

  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    return false
  }

  return true
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateResult = await apiLimiter.limit(identifier)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'অনেক বেশি অনুরোধ।', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      )
    }

    const url = request.nextUrl.searchParams.get('url')
    const filename = request.nextUrl.searchParams.get('filename') || 'document.pdf'

    if (!url) {
      return apiError('URL parameter is required', 400)
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return apiError('Invalid URL format', 400)
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return apiError('Invalid URL protocol', 400)
    }

    // SSRF protection: block internal/private URLs
    if (!isUrlSafe(parsedUrl)) {
      return apiError('Access to this URL is not allowed', 403)
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDFDownloader/1.0)',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      )
    }

    // Validate content type
    const contentType = response.headers.get('content-type') || ''
    const allowedContentTypes = ['application/pdf', 'image/', 'text/html', 'text/plain']
    if (!allowedContentTypes.some(t => contentType.startsWith(t)) && contentType !== 'application/octet-stream') {
      return apiError('Invalid content type', 400)
    }

    const buffer = await response.arrayBuffer()

    // Limit response size to 50MB
    if (buffer.byteLength > 50 * 1024 * 1024) {
      return apiError('File too large', 400)
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return apiError('Failed to download PDF.', 500)
  }
}
