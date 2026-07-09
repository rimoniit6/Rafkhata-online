'use client'

import { UploadDropzone } from '@/lib/uploadthing/client'
import { cn } from '@/lib/utils'
import { FileText,Loader2,X } from 'lucide-react'
import Image from 'next/image'
import { useCallback,useState } from 'react'

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
  placeholder: _placeholder = 'ছবি আপলোড করুন বা টেনে আনুন',
  allowPdf = false,
  maxSize: _maxSize = 5 * 1024 * 1024,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

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
            <Image
              src={value}
              alt="Uploaded"
              fill
              className="object-contain"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleRemove()}
              className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {uploading ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">আপলোড হচ্ছে...</p>
            </div>
          ) : (
            <UploadDropzone
              endpoint={allowPdf ? 'mediaUploader' : 'imageUploader'}
              onUploadBegin={() => setUploading(true)}
              onClientUploadComplete={(res) => {
                setUploading(false)
                if (res?.[0]?.ufsUrl ?? res?.[0]?.url) {
                  onChange(res[0].ufsUrl ?? res[0].url)
                }
              }}
              onUploadError={(error: Error) => {
                setUploading(false)
                alert(error.message || 'আপলোড করতে সমস্যা হয়েছে')
              }}
              appearance={{
                container: {
                  borderRadius: '0.5rem',
                  border: '2px dashed hsl(var(--border))',
                  background: 'transparent',
                  padding: '1.5rem',
                  cursor: 'pointer',
                },
                label: {
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '0.875rem',
                },
                allowedContent: {
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '0.75rem',
                },
                button: {
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                },
              }}
              config={{ mode: 'auto' }}
            />
          )}
        </div>
      )}
    </div>
  )
}
