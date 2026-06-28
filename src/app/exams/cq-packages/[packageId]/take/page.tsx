import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import CQExamViewerPage from '@/components/cq-exam/CQExamViewerPage'
import { getServerPageMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const meta = await getServerPageMeta('cq-exam-viewer')
    return { title: meta.title, description: meta.description, openGraph: { title: meta.title, description: meta.description } }
  } catch { return {} }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <CQExamViewerPage />
      </Suspense>
    </AppShell>
  )
}
