'use client'

import React, { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { detectMathFormat, normalizeMathInput } from '@/lib/math-converter'

interface MathBlockProps {
  content?: string
  latex?: string
  mathml?: string
  displayMode?: boolean
  className?: string
  inline?: boolean
  fallback?: string
}

function renderLatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    })
  } catch {
    return `<span class="text-red-500 text-xs">${math}</span>`
  }
}

export default function MathBlock({
  content,
  latex,
  mathml,
  displayMode = true,
  className,
  inline = false,
  fallback,
}: MathBlockProps) {
  const source = content || latex || mathml || ''

  const rendered = useMemo(() => {
    if (!source) return null

    const format = mathml ? 'mathml' : detectMathFormat(source)
    let latexStr: string

    if (format === 'mathml' || !!mathml) {
      const normalized = normalizeMathInput(mathml || source)
      latexStr = normalized.content
    } else {
      latexStr = source
    }

    if (!latexStr) {
      return fallback || null
    }

    const html = renderLatex(latexStr, displayMode)

    if (inline) {
      return (
        <span
          className={cn('mx-0.5 align-middle', className)}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      )
    }

    return (
      <div
        className={cn('my-3 overflow-x-auto text-center', className)}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    )
  }, [source, mathml, displayMode, className, inline, fallback])

  return rendered
}
