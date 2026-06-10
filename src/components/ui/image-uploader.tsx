'use client'

import React, { useState, useRef, useCallback } from 'react'
import { ImagePlus, X, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  className?: string
  placeholder?: string
  allowPdf?: boolean
  accept?: string
  maxSize?: number
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  label,
  className,
  placeholder = 'ছবি আপলোড করুন বা টেনে আনুন',
  allowPdf = false,
  accept,
  maxSize = 5 * 1024 * 1024,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (allowPdf && file.type === 'application/pdf') {
      // PDF files are allowed
    } else if (!file.type.startsWith('image/')) {
      alert('শুধুমাত্র ছবি ফাইল আপলোড করুন')
      return
    }
    if (file.size > maxSize) {
      alert(`ফাইলের আকার ${Math.round(maxSize / 1024 / 1024)}MB এর কম হতে হবে`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
      } else {
        const err = await res.json()
        alert(err.error || 'আপলোড করতে সমস্যা হয়েছে')
      }
    } catch {
      alert('নেটওয়ার্ক সমস্যা')
    } finally {
      setUploading(false)
    }
  }, [onChange, allowPdf, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleRemove = useCallback(() => {
    if (onRemove) onRemove()
    onChange('')
  }, [onChange, onRemove])

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      {value ? (
        <div className="relative group rounded-lg border border-border overflow-hidden bg-muted/30">
          {value.endsWith('.pdf') || value.toLowerCase().includes('application/pdf') ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <FileText className="size-12 text-red-500" />
              <p className="text-sm text-muted-foreground">PDF ফাইল আপলোড হয়েছে</p>
            </div>
          ) : (
            <img
              src={value}
              alt="Uploaded"
              className="w-full max-h-48 object-contain"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              পরিবর্তন
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
            dragOver
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
              : 'border-border hover:border-emerald-400 hover:bg-muted/30',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-muted-foreground">আপলোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {allowPdf ? <FileText className="h-8 w-8 text-muted-foreground" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground/60">{allowPdf ? 'JPEG, PNG, GIF, WebP, SVG, PDF' : 'JPEG, PNG, GIF, WebP, SVG'} (সর্বোচ্চ {Math.round(maxSize / 1024 / 1024)}MB)</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept || (allowPdf ? 'image/*,.pdf' : 'image/*')}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
