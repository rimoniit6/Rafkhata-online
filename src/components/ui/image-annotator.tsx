'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Pencil, Square, Circle, Type, Undo, Redo, Trash2, Save, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Annotation {
  id: string
  type: 'freehand' | 'rect' | 'circle' | 'text'
  points: { x: number; y: number }[]
  color: string
  text?: string
  fontSize?: number
}

interface ImageAnnotatorProps {
  imageUrl: string
  annotations?: Annotation[]
  onSave?: (annotations: Annotation[]) => void
  readonly?: boolean
  className?: string
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
const DEFAULT_COLOR = '#ef4444'

export default function ImageAnnotator({
  imageUrl,
  annotations: initialAnnotations,
  onSave,
  readonly = false,
  className,
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [tool, setTool] = useState<'select' | 'freehand' | 'rect' | 'circle' | 'text'>('select')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations || [])
  const [history, setHistory] = useState<Annotation[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Annotation | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    // Map display coordinates directly to image natural coordinates.
    // This handles CSS stretching (w-full) correctly and works
    // because redraw uses ctx.scale(scale, scale) where scale is
    // applied to all drawing, so annotations must be in image-space.
    return {
      x: (e.clientX - rect.left) * (img.naturalWidth / rect.width),
      y: (e.clientY - rect.top) * (img.naturalHeight / rect.height),
    }
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(scale, scale)

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width / scale, canvas.height / scale)

    // Draw all annotations
    for (const ann of [...annotations, ...(currentPath ? [currentPath] : [])]) {
      ctx.strokeStyle = ann.color
      ctx.fillStyle = ann.color
      ctx.lineWidth = 2

      if (ann.type === 'freehand' && ann.points.length > 1) {
        ctx.beginPath()
        ctx.moveTo(ann.points[0].x, ann.points[0].y)
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y)
        }
        ctx.stroke()
      } else if (ann.type === 'rect' && ann.points.length === 2) {
        const x = Math.min(ann.points[0].x, ann.points[1].x)
        const y = Math.min(ann.points[0].y, ann.points[1].y)
        const w = Math.abs(ann.points[1].x - ann.points[0].x)
        const h = Math.abs(ann.points[1].y - ann.points[0].y)
        ctx.strokeRect(x, y, w, h)
        ctx.fillStyle = ann.color + '20'
        ctx.fillRect(x, y, w, h)
      } else if (ann.type === 'circle' && ann.points.length === 2) {
        const dx = ann.points[1].x - ann.points[0].x
        const dy = ann.points[1].y - ann.points[0].y
        const r = Math.sqrt(dx * dx + dy * dy)
        ctx.beginPath()
        ctx.arc(ann.points[0].x, ann.points[0].y, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = ann.color + '20'
        ctx.fill()
      } else if (ann.type === 'text' && ann.text && ann.points.length > 0) {
        ctx.font = `${ann.fontSize || 16}px sans-serif`
        ctx.fillStyle = ann.color
        ctx.fillText(ann.text, ann.points[0].x, ann.points[0].y)
      }
    }

    ctx.restore()
  }, [annotations, currentPath, scale])

  useEffect(() => {
    if (imageLoaded) redraw()
  }, [imageLoaded, redraw, annotations])

  const handleImageLoad = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    const container = containerRef.current
    if (!canvas || !img || !container) return

    const maxW = container.clientWidth
    const maxH = 500
    const scaleX = maxW / img.naturalWidth
    const scaleY = maxH / img.naturalHeight
    const s = Math.min(scaleX, scaleY, 1)

    setScale(s)
    canvas.width = img.naturalWidth * s
    canvas.height = img.naturalHeight * s
    setImageLoaded(true)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly || tool === 'select') {
      setDragStart({ x: e.clientX, y: e.clientY })
      return
    }

    setIsDrawing(true)
    const pt = getCanvasPoint(e)
    const id = Math.random().toString(36).slice(2)
    setCurrentPath({
      id,
      type: tool,
      points: [pt],
      color,
      text: tool === 'text' ? prompt('টীকা লিখুন:') || 'টীকা' : undefined,
      fontSize: 16,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'select' && dragStart) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x),
        y: offset.y + (e.clientY - dragStart.y),
      })
      setDragStart({ x: e.clientX, y: e.clientY })
      return
    }

    if (!isDrawing || !currentPath) return
    const pt = getCanvasPoint(e)
    setCurrentPath({
      ...currentPath,
      points: currentPath.type === 'freehand'
        ? [...currentPath.points, pt]
        : [currentPath.points[0], pt],
    })
  }

  const handleMouseUp = () => {
    setDragStart(null)
    if (!isDrawing || !currentPath) return
    setIsDrawing(false)

    if (currentPath.points.length > 1 || currentPath.type === 'text') {
      const newAnnotations = [...annotations, currentPath]
      setAnnotations(newAnnotations)
      setHistory([...history.slice(0, historyIndex + 1), newAnnotations])
      setHistoryIndex(historyIndex + 1)
    }
    setCurrentPath(null)
  }

  const undo = () => {
    if (historyIndex >= 0) {
      setAnnotations(history[historyIndex - 1] || [])
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setAnnotations(history[historyIndex + 1])
      setHistoryIndex(historyIndex + 1)
    }
  }

  const clearAll = () => {
    setAnnotations([])
    setHistory([...history.slice(0, historyIndex + 1), []])
    setHistoryIndex(historyIndex + 1)
  }

  const handleSave = () => {
    onSave?.(annotations)
  }

  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'সিলেক্ট' },
    { id: 'freehand' as const, icon: Pencil, label: 'ফ্রিহ্যান্ড' },
    { id: 'rect' as const, icon: Square, label: 'আয়তক্ষেত্র' },
    { id: 'circle' as const, icon: Circle, label: 'বৃত্ত' },
    { id: 'text' as const, icon: Type, label: 'টেক্সট' },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {!readonly && (
        <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg bg-muted/50 border">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? 'default' : 'ghost'}
              size="sm"
              className="h-8 gap-1"
              onClick={() => setTool(t.id)}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">{t.label}</span>
            </Button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {COLORS.map((c) => (
            <button
              key={c}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all',
                color === c ? 'border-foreground scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="sm" className="h-8" onClick={undo} disabled={historyIndex < 0}>
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={clearAll} disabled={annotations.length === 0}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <div className="flex-1" />

          <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={annotations.length === 0}>
            <Save className="h-3.5 w-3.5" />
            <span className="text-xs">সংরক্ষণ</span>
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          'relative rounded-lg overflow-hidden border bg-muted/30',
          readonly && 'cursor-default'
        )}
        style={{ maxHeight: 500 }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Annotatable image"
          className="hidden"
          onLoad={handleImageLoad}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {!imageLoaded && (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            ছবি লোড হচ্ছে...
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={cn(
            'w-full',
            !readonly && 'cursor-crosshair',
            tool === 'select' && !readonly && 'cursor-grab'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  )
}
