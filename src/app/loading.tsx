'use client'

import { BookLoader } from '@/components/loading/BookLoader'
import { CircularProgress } from '@/components/loading/CircularProgress'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <BookLoader />
        <CircularProgress />
      </div>
    </div>
  )
}
