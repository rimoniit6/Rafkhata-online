'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LightboxImage {
  id: string
  url: string
  alt?: string
  annotations?: string | null
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]

  // Reset state when switching images
  useEffect(() => {
    setZoom(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
    setImageLoaded(false)
  }, [currentIndex])

  // Keyboard handlers
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev))
          break
        case '+':
        case '=':
          setZoom((prev) => Math.min(prev + 0.25, 5))
          break
        case '-':
          setZoom((prev) => Math.max(prev - 0.25, 0.25))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, images.length, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [zoom, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.25, Math.min(5, prev + delta)))
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev))
  }, [images.length])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await containerRef.current.requestFullscreen()
    }
  }, [])

  if (!open || !currentImage) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.alt && (
            <span className="text-white/50 text-xs truncate max-w-[200px] hidden sm:inline">
              {currentImage.alt}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); resetZoom() }}
            title="রিসেট"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.max(p - 0.25, 0.25)) }}
            title="জুম আউট"
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white/60 text-xs min-w-[40px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setZoom((p) => Math.min(p + 0.25, 5)) }}
            title="জুম ইন"
            disabled={zoom >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setRotation((p) => p + 90) }}
            title="ঘোরান"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
            title="ফুলস্ক্রিন"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            title="বন্ধ করুন (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Prev/Next arrows */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 z-10"
            onClick={(e) => { e.stopPropagation(); handlePrev() }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {currentIndex < images.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 z-10"
            onClick={(e) => { e.stopPropagation(); handleNext() }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* The image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={currentImage.url}
          alt={currentImage.alt || 'লাইটবক্স ছবি'}
          className={cn(
            'max-w-[90vw] max-h-[80vh] object-contain select-none transition-transform duration-100',
            zoom > 1 ? 'cursor-grab' : 'cursor-default',
            isDragging && 'cursor-grabbing',
            !imageLoaded && 'opacity-0',
          )}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
          }}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />

        {/* Loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white/30 text-xs pointer-events-none">
          স্ক্রল = জুম • ক্লিক+ড্র্যাগ = প্যান • ← → = নেভিগেট • Esc = বন্ধ
        </div>
      </div>
    </div>
  )
}
