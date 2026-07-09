import SocialLoginPage from '@/components/auth/SocialLoginPage'
import AppShell from '@/components/layout/AppShell'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'লগইন - শিক্ষা বাংলা',
    description: 'আপনার অ্যাকাউন্টে লগইন করুন এবং শিক্ষা বাংলার সকল ক্লাস, লেকচার ও প্রশ্ন ব্যাংক উপভোগ করুন।',
    alternates: { canonical: 'login' },
    openGraph: {
      title: 'লগইন - শিক্ষা বাংলা',
      description: 'আপনার অ্যাকাউন্টে লগইন করুন এবং শিক্ষা বাংলার সকল ক্লাস, লেকচার ও প্রশ্ন ব্যাংক উপভোগ করুন।',
      url: `${siteUrl}/login`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <SocialLoginPage />
      </Suspense>
    </AppShell>
  )
}