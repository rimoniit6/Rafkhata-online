import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingSkeleton() {
  return (
    <div>
      <div className="sticky top-16 z-30 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
