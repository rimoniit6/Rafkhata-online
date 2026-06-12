'use client'

/**
 * RichContentRenderer — SINGLE entry point for all formatted content.
 *
 * KaTeX renders LaTeX ($...$ / $$...$$). MathJax renders any <math> tags
 * that survived MathML→LaTeX conversion (fallback).
 *
 * No overlap: KaTeX handles LaTeX, MathJax handles <math>. Two engines,
 * two content types — zero double-rendering.
 *
 * Anti-flash: Content with MathML waits for MathJax typeset before becoming
 * visible, preventing raw unstyled MathML flash.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { processContent } from '@/lib/mathml-service'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

interface RichContentRendererProps {
  content: string
  className?: string
  inline?: boolean
  as?: 'div' | 'span' | 'p'
  maxLength?: number
}

export default function RichContentRenderer({
  content,
  className,
  inline = false,
  as: WrapperProp,
  maxLength,
}: RichContentRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [mathReady, setMathReady] = useState(true)

  const { html, hasSurvivingMathML } = useMemo(() => {
    return processContent(content)
  }, [content])

  const needsMathJax = html && hasSurvivingMathML

  useEffect(() => {
    if (!needsMathJax) return

    const el = wrapperRef.current
    if (!el) return

    const tryTypeset = (retries: number) => {
      const mj = (window as unknown as { MathJax?: { typesetPromise: (els: HTMLElement[]) => Promise<void> } }).MathJax
      if (mj?.typesetPromise) {
        mj.typesetPromise([el]).then(() => setMathReady(true)).catch(() => setMathReady(true))
      } else if (retries > 0) {
        setTimeout(() => tryTypeset(retries - 1), 300)
      } else {
        setMathReady(true)
      }
    }
    tryTypeset(5)
  }, [needsMathJax])

  const showMathLoader = needsMathJax && !mathReady

  if (!content) return null

  const Wrapper = WrapperProp || (inline ? 'span' : 'div')

  const trimmed = maxLength && html.length > maxLength
    ? html.slice(0, maxLength) + '...'
    : html

  return (
    <Wrapper
      ref={wrapperRef as never}
      className={cn(
        'transition-opacity duration-300',
        showMathLoader && 'opacity-0',
        className
      )}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  )
}
