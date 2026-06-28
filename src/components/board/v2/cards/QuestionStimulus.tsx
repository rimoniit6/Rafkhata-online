'use client'

import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

interface QuestionStimulusProps {
  html: string
  className?: string
  maxLines?: number
  blurred?: boolean
}

export function QuestionStimulus({ html, className, maxLines, blurred }: QuestionStimulusProps) {
  return (
    <div
      className={cn(
        'text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit',
        maxLines && !blurred && (maxLines === 2 ? 'line-clamp-2' : ''),
        blurred && 'blur-sm select-none',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}
