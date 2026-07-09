import AppShell from '@/components/layout/AppShell'
import SuggestionsPage from '@/components/suggestion/SuggestionsPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'সাজেশন - শিক্ষা বাংলা',
    description: 'পরীক্ষার প্রস্তুতির জন্য সাজেশন দেখুন এবং ডাউনলোড করুন।',
    alternates: { canonical: 'suggestions' },
    openGraph: {
      title: 'সাজেশন - শিক্ষা বাংলা',
      description: 'পরীক্ষার প্রস্তুতির জন্য সাজেশন দেখুন এবং ডাউনলোড করুন।',
      url: `${siteUrl}/suggestions`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <SuggestionsPage />
      </Suspense>
    </AppShell>
  )
}