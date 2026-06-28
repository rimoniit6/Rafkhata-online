import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import ClassHubPage from '@/components/class-hub/ClassHubPage'
import { getServerPageMeta } from '@/lib/seo'
import { BreadcrumbSchema } from '@/components/shared/JsonLd'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_NAME = 'শিক্ষা বাংলা'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'

export async function generateMetadata(
  { params }: { params: Promise<{ classSlug: string }> }
): Promise<Metadata> {
  try {
    const { classSlug } = await params
    const classCat = await db.classCategory.findUnique({
      where: { slug: classSlug },
      select: { name: true, description: true },
    })
    if (classCat) {
      return {
        title: `${classCat.name} - ${SITE_NAME}`,
        description: classCat.description || `${classCat.name} - সকল বিষয়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।`,
        openGraph: { title: `${classCat.name} - ${SITE_NAME}`, description: classCat.description || `${classCat.name} - সকল বিষয়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।` },
      }
    }
    const meta = await getServerPageMeta('class-detail', { classSlug })
    return {
      title: meta.title,
      description: meta.description,
      openGraph: { title: meta.title, description: meta.description, images: meta.ogImage ? [{ url: meta.ogImage }] : undefined },
    }
  } catch {
    return {}
  }
}

export default async function Page(
  { params }: { params: Promise<{ classSlug: string }> }
) {
  const { classSlug } = await params

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'হোম', url: SITE_URL },
        { name: classSlug, url: `${SITE_URL}/class/${classSlug}` },
      ]} />
      <AppShell>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
          <ClassHubPage />
        </Suspense>
      </AppShell>
    </>
  )
}
