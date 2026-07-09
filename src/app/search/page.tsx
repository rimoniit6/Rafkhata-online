import AppShell from '@/components/layout/AppShell'
import SearchResultsPage from '@/components/search/SearchResultsPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'অনুসন্ধান - শিক্ষা বাংলা',
    description: 'শিক্ষা বাংলায় ক্লাস, লেকচার, প্রশ্ন এবং আরও অনেক কিছু অনুসন্ধান করুন।',
    alternates: { canonical: 'search' },
    openGraph: {
      title: 'অনুসন্ধান - শিক্ষা বাংলা',
      description: 'শিক্ষা বাংলায় ক্লাস, লেকচার, প্রশ্ন এবং আরও অনেক কিছু অনুসন্ধান করুন।',
      url: `${siteUrl}/search`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <SearchResultsPage />
      </Suspense>
    </AppShell>
  )
}