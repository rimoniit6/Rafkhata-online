import { CardSkeleton } from '@/components/shared/Skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        <CardSkeleton />
      </div>
    </div>
  )
}
