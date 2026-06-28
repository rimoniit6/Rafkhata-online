import KnowledgeQuestionsPage from '@/components/knowledge/KnowledgeQuestionsPage'
import AppShell from '@/components/layout/AppShell'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'জ্ঞান মূলক প্রশ্ন - শিক্ষা বাংলা',
    description: 'জ্ঞান মূলক প্রশ্ন দেখুন এবং অনুশীলন করে আপনার প্রস্তুতি জোরদার করুন।',
    alternates: { canonical: 'knowledge-questions' },
    openGraph: {
      title: 'জ্ঞান মূলক প্রশ্ন - শিক্ষা বাংলা',
      description: 'জ্ঞান মূলক প্রশ্ন দেখুন এবং অনুশীলন করে আপনার প্রস্তুতি জোরদার করুন।',
      url: `${siteUrl}/knowledge-questions`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <KnowledgeQuestionsPage />
      </Suspense>
    </AppShell>
  )
}