'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'

/** Extract a user-facing Bangla/English message from any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'একটি অজানা ত্রুটি হয়েছে।'
}

interface QueryErrorProps {
  error?: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

/**
 * Reusable error + retry surface for React Query powered admin views.
 * The `api` client already surfaces errors via the global ApiErrorHandler
 * toast, so this component focuses on an inline, retryable fallback.
 */
export function QueryError({
  error,
  onRetry,
  title = 'লোড করতে সমস্যা হয়েছে',
  className,
}: QueryErrorProps) {
  const message = getErrorMessage(error)
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center ${
        className ?? ''
      }`}
    >
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" /> আবার চেষ্টা করুন
        </Button>
      )}
    </div>
  )
}
