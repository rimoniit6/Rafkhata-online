'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getFileUrl, getImagePlaceholder } from '@/lib/file-url'
import { cn } from '@/lib/utils'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  fallback?: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLImageElement>
}

export default function SafeImage({ src, alt, fallback, className, width, height, priority, loading, style, onClick }: SafeImageProps) {
  const [error, setError] = useState(false)
  const resolvedSrc = src ? getFileUrl(src) : ''
  const imgSrc = !resolvedSrc
    ? (fallback || getImagePlaceholder())
    : error
      ? (fallback || getImagePlaceholder())
      : resolvedSrc

  const hasExplicitDimensions = width !== undefined || height !== undefined

  if (hasExplicitDimensions) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        className={className}
        width={width || 400}
        height={height || 300}
        priority={priority}
        loading={loading}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={style}
        onClick={onClick}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className={cn("relative", className)} style={style} onClick={onClick}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        loading={loading}
        sizes="(max-width: 768px) 100vw, 33vw"
        onError={() => setError(true)}
      />
    </div>
  )
}
