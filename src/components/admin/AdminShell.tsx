'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const AdminLayout = dynamic(
  () => import('@/components/admin/AdminLayout'),
  { ssr: false }
)

const FALLBACK = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
)

export default function AdminShell() {
  return (
    <Suspense fallback={FALLBACK}>
      <AdminLayout />
    </Suspense>
  )
}
