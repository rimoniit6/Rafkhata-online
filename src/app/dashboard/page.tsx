import AppShell from '@/components/layout/AppShell'
import UserDashboardPage from '@/components/user/UserDashboardPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'ড্যাশবোর্ড - শিক্ষা বাংলা',
    description: 'আপনার ড্যাশবোর্ড থেকে শিক্ষার অগ্রগতি ট্র্যাক করুন, লেকচার দেখুন ও প্রশ্ন সমাধান করুন।',
    alternates: { canonical: 'dashboard' },
    openGraph: {
      title: 'ড্যাশবোর্ড - শিক্ষা বাংলা',
      description: 'আপনার ড্যাশবোর্ড থেকে শিক্ষার অগ্রগতি ট্র্যাক করুন, লেকচার দেখুন ও প্রশ্ন সমাধান করুন।',
      url: `${siteUrl}/dashboard`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <UserDashboardPage />
      </Suspense>
    </AppShell>
  )
}