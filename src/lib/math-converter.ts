/**
 * Math Converter — detect format, normalize MathML→LaTeX, process content blocks.
 *
 * Client-side: uses DOMParser (browser) for full MathML→LaTeX conversion.
 * Server-side: regex-based fallback for basic MathML patterns.
 *
 * Usage (admin save flow):
 *   import { processContentBlocks } from '@/lib/math-converter'
 *   blocks = processContentBlocks(blocks)  // all math blocks → LaTeX
 *   serializeBlocks(blocks)                // store as JSON
 */

import { convertMathMLToLatex } from '@/lib/mathml-to-latex'

interface MathContentBlock {
  id: string
  type: string
  content?: string
  [key: string]: unknown
}

// ─── Format Detection ──────────────────────────────────────────────

export type MathFormat = 'latex' | 'mathml' | 'plain'

export function detectMathFormat(input: string): MathFormat {
  if (!input) return 'plain'
  const trimmed = input.trim()
  if (trimmed.startsWith('<math') || /^<(?:mrow|mi|mo|mn|msup|msub|mfrac|msqrt|mover|munder|mtable)/.test(trimmed)) {
    return 'mathml'
  }
  return 'latex'
}

// ─── Normalization (client-side, uses DOMParser) ──────────────────

export interface NormalizedMath {
  format: 'latex'
  originalFormat: MathFormat
  content: string
  converted: boolean
}

/**
 * Normalize math input to LaTeX.
 * - If input is MathML: converts to LaTeX via convertMathMLToLatex()
 * - If input is LaTeX: returns as-is
 */
export function normalizeMathInput(input: string): NormalizedMath {
  if (!input) return { format: 'latex', originalFormat: 'plain', content: '', converted: false }

  const format = detectMathFormat(input)

  if (format === 'mathml') {
    const latex = convertMathMLToLatex(input)
    if (latex) {
      return { format: 'latex', originalFormat: 'mathml', content: latex, converted: true }
    }
    // Conversion failed — keep original MathML for MathJax fallback
    return { format: 'latex', originalFormat: 'mathml', content: input, converted: false }
  }

  return { format: 'latex', originalFormat: 'latex', content: input, converted: false }
}

// ─── Content Block Processing ─────────────────────────────────────

/**
 * Process all math blocks in a ContentBlock[] array.
 * Converts MathML blocks to LaTeX where possible.
 * Returns new array (immutable).
 */
export function processContentBlocks<T extends MathContentBlock>(blocks: T[]): T[] {
  if (!blocks || !Array.isArray(blocks)) return blocks

  return blocks.map((block) => {
    if (block.type !== 'math') return block
    if (!block.content) return block

    const normalized = normalizeMathInput(block.content)
    if (normalized.converted) {
      return { ...block, content: normalized.content }
    }
    return block
  })
}
