'use client'

import { Suspense } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminSubPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <AdminLayout />
    </Suspense>
  )
}
