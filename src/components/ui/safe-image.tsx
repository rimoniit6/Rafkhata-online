'use client'

import React, { useState } from 'react'
import { getFileUrl, getImagePlaceholder } from '@/lib/file-url'
import { cn } from '@/lib/utils'

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string | null | undefined
  alt: string
  fallback?: string
  className?: string
}

/**
 * SafeImage — renders an <img> tag that:
 * 1. Resolves relative paths to absolute URLs via getFileUrl()
 * 2. Shows a placeholder on load error (onError)
 * 3. Allows a custom fallback if needed
 */
export default function SafeImage({ src, alt, fallback, className, ...props }: SafeImageProps) {
  const [error, setError] = useState(false)
  const resolvedSrc = src ? getFileUrl(src) : ''

  if (!resolvedSrc) {
    return (
      <img
        src={fallback || getImagePlaceholder()}
        alt={alt}
        className={className}
        {...props}
      />
    )
  }

  return (
    <img
      src={error ? fallback || getImagePlaceholder() : resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  )
}
