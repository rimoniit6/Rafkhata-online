import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import CourseListPage from '@/components/course/CourseListPage'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <CourseListPage />
      </Suspense>
    </AppShell>
  )
}
