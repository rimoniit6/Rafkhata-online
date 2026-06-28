import { LectureSkeleton } from '@/components/shared/Skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <LectureSkeleton />
      </div>
    </div>
  )
}
