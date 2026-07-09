import ClassCategories from '@/components/home/ClassCategories'
import AppShell from '@/components/layout/AppShell'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'ক্লাস সমূহ - শিক্ষা বাংলা',
    description: 'ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত সকল ক্লাসের বিষয় ও কন্টেন্ট দেখুন এবং আপনার পড়াশোনা শুরু করুন।',
    alternates: { canonical: 'classes' },
    openGraph: {
      title: 'ক্লাস সমূহ - শিক্ষা বাংলা',
      description: 'ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত সকল ক্লাসের বিষয় ও কন্টেন্ট দেখুন এবং আপনার পড়াশোনা শুরু করুন।',
      url: `${siteUrl}/classes`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <ClassCategories />
      </Suspense>
    </AppShell>
  )
}