import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyLoaderProps {
  children: React.ReactNode
  loading: boolean
  height?: string
  className?: string
}

export default function LazyLoader({ 
  children, 
  loading, 
  height = 'h-96',
  className = ''
}: LazyLoaderProps) {
  if (!loading) {
    return <>{children}</>
  }

  return (
    <div className={`animate-fade-in space-y-4 ${className}`}>
      <Skeleton className={`w-full ${height}`} />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className={`w-full ${height}`} />
    </div>
  )
}
