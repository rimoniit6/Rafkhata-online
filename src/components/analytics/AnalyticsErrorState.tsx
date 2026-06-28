'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface AnalyticsErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function AnalyticsErrorState({
  message = 'Failed to load analytics data.',
  onRetry,
}: AnalyticsErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Please try again later.</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
