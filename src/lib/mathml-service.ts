'use client'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * mathml-service — SINGLE MathML/LaTeX rendering engine for the entire app
 *
 * RULE: All content MUST pass through this service EXACTLY ONCE.
 * No component may re-process or re-render already-rendered output.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Pipeline (single pass):
 *   Input → sanitizeContent → MathML detection → MathML→LaTeX conversion
 *        → LaTeX parsing → KaTeX render → sanitizeHtml → FINAL HTML
 *                                                         ↓ on failure
 *                                              "[ Math rendering error ]"
 *
 * Double-render protection:
 *   - contentCache: Map<string, ProcessedResult> — caches by input content
 *   - A WeakSet tracks object references for extra protection
 */

import katex from 'katex'
import { sanitizeHtml, containsHtml } from '@/lib/sanitize'
import { sanitizeContent } from '@/lib/sanitize-content'
import { containsMathML, replaceMathMLWithLatex } from '@/lib/mathml-to-latex'

// ─── Constants ───────────────────────────────────────────────────────

const FALLBACK_ERROR_HTML =
  '<span class="mx-0.5 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">[ Math rendering error ]</span>'

const CACHE_MAX = 500

// ─── Render Lock: content-level cache prevents double processing ────

const contentCache = new Map<string, ProcessedResult>()

export function clearMathCache(): void {
  contentCache.clear()
}

// ─── KaTeX Cache (per-expression) ───────────────────────────────────

const katexCache = new Map<string, string>()

function getCachedKatex(math: string, displayMode: boolean): string | undefined {
  return katexCache.get(`katex:${displayMode}:${math}`)
}

function setCachedKatex(math: string, displayMode: boolean, html: string): void {
  const key = `katex:${displayMode}:${math}`
  if (katexCache.size >= CACHE_MAX) {
    const first = katexCache.keys().next().value
    if (first) katexCache.delete(first)
  }
  katexCache.set(key, html)
}

// ─── HTML Escape ────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── KaTeX Rendering (with cache) ───────────────────────────────────

function renderLatex(math: string, displayMode: boolean): string {
  const cached = getCachedKatex(math, displayMode)
  if (cached) return cached

  try {
    const raw = katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    })
    const sanitized = sanitizeHtml(raw)
    setCachedKatex(math, displayMode, sanitized)
    return sanitized
  } catch (e) {
    console.warn('[MathML Service] KaTeX rendering failed:', e)
    return FALLBACK_ERROR_HTML
  }
}

// ─── LaTeX Parsing ─────────────────────────────────────────────────

function processPureTextWithLatex(text: string): string {
  const parts: { type: 'text' | 'block-math' | 'inline-math'; value: string }[] = []

  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g
  let match: RegExpExecArray | null
  let lastIndex = 0

  const blockParts: { type: 'text' | 'block-math'; value: string }[] = []

  while ((match = blockMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blockParts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    blockParts.push({ type: 'block-math', value: match[1].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    blockParts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  if (blockParts.length === 0) {
    blockParts.push({ type: 'text', value: text })
  }

  for (const part of blockParts) {
    if (part.type === 'block-math') {
      parts.push({ type: 'block-math', value: part.value })
    } else {
      const inlineMathRegex = /\$([^\$]+?)\$/g
      let inlineLastIndex = 0
      let inlineMatch: RegExpExecArray | null
      let hasInlineMath = false

      while ((inlineMatch = inlineMathRegex.exec(part.value)) !== null) {
        hasInlineMath = true
        if (inlineMatch.index > inlineLastIndex) {
          parts.push({ type: 'text', value: part.value.slice(inlineLastIndex, inlineMatch.index) })
        }
        parts.push({ type: 'inline-math', value: inlineMatch[1].trim() })
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length
      }
      if (!hasInlineMath) {
        parts.push({ type: 'text', value: part.value })
      } else if (inlineLastIndex < part.value.length) {
        parts.push({ type: 'text', value: part.value.slice(inlineLastIndex) })
      }
    }
  }

  return parts.map((part) => {
    if (part.type === 'block-math') {
      return `<div class="my-3 overflow-x-auto text-center">${renderLatex(part.value, true)}</div>`
    }
    if (part.type === 'inline-math') {
      return renderLatex(part.value, false)
    }
    return escapeHtml(part.value)
  }).join('')
}

function processLatexInHtmlContent(html: string): string {
  const parts: string[] = []
  let lastIndex = 0
  const tagRegex = /(<[^>]+>)/g
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processPureTextWithLatex(html.slice(lastIndex, match.index)))
    }
    parts.push(match[1])
    lastIndex = match.index + match[1].length
  }

  if (lastIndex < html.length) {
    parts.push(processPureTextWithLatex(html.slice(lastIndex)))
  }

  return sanitizeHtml(parts.join(''))
}

// ─── Public API ─────────────────────────────────────────────────────

export interface ProcessedResult {
  html: string
  isError: boolean
  hasSurvivingMathML: boolean
}

export interface MathmlServiceOptions {
  inline?: boolean
}

/**
 * Process content through the SINGLE MathML rendering pipeline.
 *
 * @returns ProcessedResult — final HTML ready for dangerouslySetInnerHTML
 *
 * Render Lock: content is cached by string identity.
 * Calling processContent() twice with the same string
 * returns the cached result on the second call.
 *
 * Works on both server (SSR) and client.
 * KaTeX.renderToString is pure JS — no DOM needed.
 * sanitizeHtml falls back to regex when DOMPurify unavailable.
 */
export function processContent(content: string, options?: MathmlServiceOptions): ProcessedResult {
  if (!content) return { html: '', isError: false, hasSurvivingMathML: false }

  // ── Render lock: return cached result if already processed ──
  const cached = contentCache.get(content)
  if (cached) return cached

  try {
    let processed = sanitizeContent(content)

    if (containsMathML(processed)) {
      processed = replaceMathMLWithLatex(processed)
    }

    let html: string
    if (containsHtml(processed)) {
      html = processLatexInHtmlContent(processed)
    } else {
      html = processPureTextWithLatex(processed)
    }

    const hasSurvivingMathML = /<math[\s>]/i.test(html)

    const result: ProcessedResult = { html, isError: false, hasSurvivingMathML }

    if (contentCache.size >= CACHE_MAX) {
      const first = contentCache.keys().next().value
      if (first) contentCache.delete(first)
    }
    contentCache.set(content, result)

    return result
  } catch (e) {
    console.warn('[MathML Service] Content processing failed:', e)
    return { html: FALLBACK_ERROR_HTML, isError: true, hasSurvivingMathML: false }
  }
}

export { containsMathML, replaceMathMLWithLatex } from '@/lib/mathml-to-latex'
