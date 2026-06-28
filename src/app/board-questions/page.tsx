import { BoardPage as BoardQuestionsPage } from '@/components/board/v2'
import AppShell from '@/components/layout/AppShell'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'বোর্ড প্রশ্ন - শিক্ষা বাংলা',
    description: 'পূর্ববর্তী বোর্ড পরীক্ষার প্রশ্নপত্র দেখুন এবং পরীক্ষার প্রস্তুতি নিন।',
    alternates: { canonical: 'board-questions' },
    openGraph: {
      title: 'বোর্ড প্রশ্ন - শিক্ষা বাংলা',
      description: 'পূর্ববর্তী বোর্ড পরীক্ষার প্রশ্নপত্র দেখুন এবং পরীক্ষার প্রস্তুতি নিন।',
      url: `${siteUrl}/board-questions`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <BoardQuestionsPage />
      </Suspense>
    </AppShell>
  )
}