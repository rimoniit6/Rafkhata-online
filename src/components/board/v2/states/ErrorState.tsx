'use client'

import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Failed to load questions', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-destructive mb-2">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
          Try Again
        </Button>
      )}
    </div>
  )
}
