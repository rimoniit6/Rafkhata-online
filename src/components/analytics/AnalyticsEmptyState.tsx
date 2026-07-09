'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface AnalyticsEmptyStateProps {
  title?: string
  description?: string
}

export default function AnalyticsEmptyState({
  title = 'No data available',
  description = 'There is no data for the selected period.',
}: AnalyticsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground/60 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
