/**
 * Centralized HTML sanitizer configuration for the entire application.
 *
 * This is the SINGLE source of truth for sanitization rules.
 * All content rendering MUST use `sanitizeHtml()` from this module.
 *
 * NEVER create inline DOMPurify configurations elsewhere.
 */

// ─── Allowed Tags ─────────────────────────────────────────────────
// These are the ONLY HTML tags that will survive sanitization.

const ALLOWED_TAGS: string[] = [
  // ── Document structure ──
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'div', 'span', 'section',
  'header', 'footer', 'main', 'article', 'aside',

  // ── Text formatting ──
  'b', 'i', 'em', 'strong', 'u', 's', 'del', 'ins',
  'small', 'sub', 'sup', 'mark', 'kbd', 'code', 'pre',
  'abbr', 'cite', 'q', 'blockquote',

  // ── Lists ──
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',

  // ── Tables ──
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'caption', 'colgroup', 'col',

  // ── Links & media ──
  'a', 'img', 'figure', 'figcaption',
  'video', 'audio', 'source',

  // ── MathML (fallback rendering) ──
  // MathML tags are allowed so that if MathML→LaTeX conversion fails,
  // raw MathML can still render natively in the browser or via MathJax.
  // Primary pipeline: MathML → LaTeX → KaTeX (handled before sanitization).
  // Fallback: if conversion fails, MathML passes through for native/MathJax rendering.

  // ── MathML tags (fallback for when MathML→LaTeX conversion fails) ──
  'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'msubsup',
  'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'munderover',
  'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'mlabeledtr',
  'menclose', 'merror', 'maction', 'mstyle', 'mpadded', 'mphantom',
  'mmultiscripts', 'mprescripts', 'none', 'semantics', 'annotation',

  // ── SVG (needed by KaTeX for radicals, stretchy delimiters, etc.) ──
  'svg', 'path', 'g', 'rect', 'circle', 'line', 'polygon', 'polyline', 'ellipse',
  'defs', 'use', 'clippath', 'lineargradient', 'radialgradient', 'stop',
  'text', 'tspan',

  // ── KaTeX-generated tags ──
  'katex-display', // KaTeX wrapper
  'annotation-xml',

  // ── Rubbish but harmless ──
  'wbr',
]

// ─── Allowed Attributes ──────────────────────────────────────────

const ALLOWED_ATTR: string[] = [
  // ── Global ──
  'class', 'style', 'id', 'title', 'lang', 'dir',
  'role', 'aria-hidden', 'aria-label', 'aria-describedby',

  // ── Links ──
  'href', 'target', 'rel',

  // ── Images ──
  'src', 'alt', 'width', 'height', 'loading',

  // ── Media ──
  'controls', 'autoplay', 'loop', 'muted', 'preload',
  'allow', 'allowfullscreen', 'framebuffer',

  // ── Table ──
  'colspan', 'rowspan', 'scope', 'headers',

  // ── SVG attributes (needed by KaTeX for radicals, stretchy elements) ──
  'viewbox', 'preserveaspectratio', 'd', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-opacity', 'fill-opacity', 'fill-rule',
  'transform', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'points', 'offset', 'stop-color', 'stop-opacity',
  'xmlns', 'version', 'baseprofile',

  // ── MathML attributes (for native/MathJax fallback rendering) ──
  'display', 'mathvariant', 'linethickness', 'bevelled',
  'accent', 'accentunder', 'selection', 'notation',

  // ── KaTeX-specific (for rendered LaTeX output) ──
  'data-mathml',
]

// ─── Blocked Attributes (explicitly remove even if matched) ──────

const BLOCKED_ATTR_PATTERNS: RegExp[] = [
  /^on/i,          // onclick, onerror, onload, etc.
  /^formaction/i,  // formaction
]

// ─── Simple regex-based sanitizer (always available, no deps) ────

function regexSanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
}

// ─── DOMPurify Instance (lazy, client-side only) ────────────────

type PurifyInstance = {
  sanitize: (html: string, config?: Record<string, unknown>) => string
  addHook: (hook: string, fn: (...args: unknown[]) => void) => void
}

let purifyInstance: PurifyInstance | null = null
let purifyInitAttempted = false

/**
 * Try to get a DOMPurify instance. Returns null if not available.
 */
function tryGetPurify(): PurifyInstance | null {
  // Only available in browser
  if (typeof window === 'undefined') return null

  // Don't retry endlessly
  if (purifyInitAttempted && !purifyInstance) return null
  purifyInitAttempted = true

  try {
    // Dynamic require — works in Next.js bundled code
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('isomorphic-dompurify')

    // isomorphic-dompurify can export in several ways
    let instance: PurifyInstance | null = null

    // Direct export with sanitize method
    if (mod && typeof mod.sanitize === 'function') {
      instance = mod as PurifyInstance
    }
    // Default export with sanitize method
    else if (mod?.default && typeof mod.default.sanitize === 'function') {
      instance = mod.default as PurifyInstance
    }
    // Factory function that takes window
    else if (mod && typeof mod === 'function') {
      try {
        const created = mod(window)
        if (created && typeof created.sanitize === 'function') {
          instance = created
        }
      } catch { /* factory failed */ }
    }
    // Default export as factory
    else if (mod?.default && typeof mod.default === 'function') {
      try {
        const created = mod.default(window)
        if (created && typeof created.sanitize === 'function') {
          instance = created
        }
      } catch { /* factory failed */ }
    }

    if (instance && typeof instance.sanitize === 'function') {
      // Add hook to strip event handler attributes
      try {
        instance.addHook('uponSanitizeAttribute', ((_node: unknown, data: { attrName?: string; forceRemoveAttr?: boolean }) => {
          if (data.attrName && BLOCKED_ATTR_PATTERNS.some((p) => p.test(data.attrName!))) {
            data.forceRemoveAttr = true
          }
        }) as (...args: unknown[]) => void)
      } catch {
        // addHook may not be available on all instances; that's okay
      }

      purifyInstance = instance
      return instance
    }
  } catch {
    // isomorphic-dompurify not available
  }

  // Try regular dompurify as fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify')

    let instance: PurifyInstance | null = null

    if (typeof DOMPurify === 'function') {
      try {
        instance = DOMPurify(window)
      } catch {
        try {
          instance = DOMPurify.default?.(window) ?? null
        } catch {
          instance = null
        }
      }
    } else if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
      instance = DOMPurify
    } else if (DOMPurify?.default && typeof DOMPurify.default.sanitize === 'function') {
      instance = DOMPurify.default
    } else if (DOMPurify?.default && typeof DOMPurify.default === 'function') {
      try {
        instance = DOMPurify.default(window)
      } catch {
        instance = null
      }
    }

    if (instance && typeof instance.sanitize === 'function') {
      try {
        instance.addHook('uponSanitizeAttribute', ((_node: unknown, data: { attrName?: string; forceRemoveAttr?: boolean }) => {
          if (data.attrName && BLOCKED_ATTR_PATTERNS.some((p) => p.test(data.attrName!))) {
            data.forceRemoveAttr = true
          }
        }) as (...args: unknown[]) => void)
      } catch {
        // addHook not available
      }

      purifyInstance = instance
      return instance
    }
  } catch {
    // dompurify also not available
  }

  return null
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Sanitize HTML content for safe rendering.
 *
 * This is the ONLY sanitizer you should use in the entire application.
 * It allows MathML, images, tables, and basic formatting while
 * blocking scripts, iframes, and event handlers.
 *
 * IMPORTANT: This function should only be called client-side.
 * During SSR, it uses a regex-based fallback.
 *
 * @param html - Raw HTML content to sanitize
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Try to use DOMPurify (client-side, browser environment)
  const purify = tryGetPurify()

  if (purify && typeof purify.sanitize === 'function') {
    try {
      return purify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        // Allow URI schemes for images and links
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // Keep MathML namespace
        FORCE_BODY: true,
        // Return DOM node instead of string? No, we want string
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      })
    } catch {
      // If DOMPurify sanitization fails, fall through to regex
    }
  }

  // SSR or DOMPurify unavailable — use regex-based sanitizer
  return regexSanitize(html)
}

/**
 * Check if content appears to contain HTML markup that should be
 * rendered as rich content (vs. plain text with LaTeX).
 *
 * @param content - Content string to check
 * @returns true if content likely contains HTML tags
 */
export function containsHtml(content: string): boolean {
  if (!content) return false

  // Quick check for common HTML tags and MathML
  // MathML is included so that unprocessed <math> tags take the HTML path
  // (preserving them as elements rather than escaping to text).
  const htmlTagRegex = /<(img|table|div|p|span|h[1-6]|ul|ol|li|a|br|hr|strong|em|b|i|u|s|code|pre|blockquote|figure|figcaption|video|audio|source|thead|tbody|tfoot|tr|th|td|caption|section|article|aside|header|footer|main|sup|sub|mark|small|del|ins|math)\b[^>]*>/i

  return htmlTagRegex.test(content)
}

/**
 * Get the list of allowed tags (for debugging/testing).
 */
export function getAllowedTags(): string[] {
  return [...ALLOWED_TAGS]
}

/**
 * Get the list of allowed attributes (for debugging/testing).
 */
export function getAllowedAttrs(): string[] {
  return [...ALLOWED_ATTR]
}
