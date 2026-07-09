import AppShell from '@/components/layout/AppShell'
import PremiumPage from '@/components/premium/PremiumPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'প্রিমিয়াম - শিক্ষা বাংলা',
    description: 'প্রিমিয়াম সাবস্ক্রিপশন নিন এবং সকল ক্লাস, লেকচার ও প্রশ্ন ব্যাংক আনলিমিটেড অ্যাক্সেস করুন।',
    alternates: { canonical: 'premium' },
    openGraph: {
      title: 'প্রিমিয়াম - শিক্ষা বাংলা',
      description: 'প্রিমিয়াম সাবস্ক্রিপশন নিন এবং সকল ক্লাস, লেকচার ও প্রশ্ন ব্যাংক আনলিমিটেড অ্যাক্সেস করুন।',
      url: `${siteUrl}/premium`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <PremiumPage />
      </Suspense>
    </AppShell>
  )
}