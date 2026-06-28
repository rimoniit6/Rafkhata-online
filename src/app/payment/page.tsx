import AppShell from '@/components/layout/AppShell'
import PaymentPage from '@/components/payment/PaymentPage'
import { getSiteUrl } from '@/lib/urls'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  return {
    title: 'পেমেন্ট - শিক্ষা বাংলা',
    description: 'প্রিমিয়াম সাবস্ক্রিপশনের জন্য পেমেন্ট সম্পন্ন করুন এবং শিক্ষা বাংলার সব কন্টেন্ট আনলক করুন।',
    alternates: { canonical: 'payment' },
    openGraph: {
      title: 'পেমেন্ট - শিক্ষা বাংলা',
      description: 'প্রিমিয়াম সাবস্ক্রিপশনের জন্য পেমেন্ট সম্পন্ন করুন এবং শিক্ষা বাংলার সব কন্টেন্ট আনলক করুন।',
      url: `${siteUrl}/payment`,
    },
  }
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <PaymentPage />
      </Suspense>
    </AppShell>
  )
}