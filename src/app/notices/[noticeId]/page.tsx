import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import NoticeDetailPage from '@/components/notice/NoticeDetailPage'
import { getServerPageMeta } from '@/lib/seo.server'
import { BreadcrumbSchema, ArticleJsonLd } from '@/components/shared/JsonLd'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'

const SITE_NAME = 'শিক্ষা বাংলা'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const meta = await getServerPageMeta('notice-detail')
    return {
      title: meta.title,
      description: meta.description,
      openGraph: { title: meta.title, description: meta.description },
    }
  } catch {
    return {}
  }
}

export default async function Page(
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const { noticeId } = await params

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'হোম', url: SITE_URL },
        { name: 'নোটিশ', url: `${SITE_URL}/notices` },
        { name: 'নোটিশ বিস্তারিত', url: `${SITE_URL}/notices/${noticeId}` },
      ]} />
      <ArticleJsonLd
        headline={`নোটিশ - ${SITE_NAME}`}
        description={`বিস্তারিত নোটিশ দেখুন - ${SITE_NAME}`}
        datePublished={new Date().toISOString()}
      />
      <AppShell>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
          <NoticeDetailPage />
        </Suspense>
      </AppShell>
    </>
  )
}
