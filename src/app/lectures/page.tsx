import AppShell from '@/components/layout/AppShell'
import LectureListPage from '@/components/lecture/LectureListPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'লেকচার - শিক্ষা বাংলা',
    description: 'শিক্ষা বাংলার সকল লেকচার দেখুন এবং আপনার পড়াশোনা চালিয়ে যান।',
    alternates: { canonical: 'lectures' },
    openGraph: {
      title: 'লেকচার - শিক্ষা বাংলা',
      description: 'শিক্ষা বাংলার সকল লেকচার দেখুন এবং আপনার পড়াশোনা চালিয়ে যান।',
      url: `${siteUrl}/lectures`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <LectureListPage />
      </Suspense>
    </AppShell>
  )
}