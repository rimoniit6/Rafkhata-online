import AppShell from '@/components/layout/AppShell'
import NoticesPage from '@/components/notice/NoticesPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'নোটিশ - শিক্ষা বাংলা',
    description: 'শিক্ষা বাংলার সর্বশেষ নোটিশ ও আপডেট দেখুন।',
    alternates: { canonical: 'notices' },
    openGraph: {
      title: 'নোটিশ - শিক্ষা বাংলা',
      description: 'শিক্ষা বাংলার সর্বশেষ নোটিশ ও আপডেট দেখুন।',
      url: `${siteUrl}/notices`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <NoticesPage />
      </Suspense>
    </AppShell>
  )
}