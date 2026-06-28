import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import ChapterHubPage from '@/components/chapter-hub/ChapterHubPage'
import { getServerPageMeta } from '@/lib/seo'
import { BreadcrumbSchema, CourseJsonLd } from '@/components/shared/JsonLd'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_NAME = 'শিক্ষা বাংলা'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'

export async function generateMetadata(
  { params }: { params: Promise<{ classSlug: string; subjectSlug: string; chapterSlug: string }> }
): Promise<Metadata> {
  try {
    const { classSlug, subjectSlug, chapterSlug } = await params
    const chapter = await db.chapter.findFirst({
      where: { slug: chapterSlug, subject: { slug: subjectSlug, class: { slug: classSlug } } },
      select: { name: true, description: true, subject: { select: { name: true, class: { select: { name: true } } } } },
    })
    if (chapter) {
      return {
        title: `${chapter.name} - ${chapter.subject.name} - ${SITE_NAME}`,
        description: chapter.description || `${chapter.name} - ${chapter.subject.name} - ${chapter.subject.class.name} - লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।`,
        openGraph: { title: `${chapter.name} - ${chapter.subject.name} - ${SITE_NAME}`, description: chapter.description || `${chapter.name} - ${chapter.subject.name} - ${chapter.subject.class.name} - লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।` },
      }
    }
    const meta = await getServerPageMeta('chapter-detail', { classSlug, subjectSlug, chapterSlug })
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
  { params }: { params: Promise<{ classSlug: string; subjectSlug: string; chapterSlug: string }> }
) {
  const { classSlug, subjectSlug, chapterSlug } = await params
  const pageUrl = `${SITE_URL}/class/${classSlug}/${subjectSlug}/${chapterSlug}`

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'হোম', url: SITE_URL },
        { name: classSlug, url: `${SITE_URL}/class/${classSlug}` },
        { name: subjectSlug, url: `${SITE_URL}/class/${classSlug}/${subjectSlug}` },
        { name: chapterSlug, url: pageUrl },
      ]} />
      <CourseJsonLd
        name={chapterSlug}
        description={chapterSlug}
        url={pageUrl}
      />
      <AppShell>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
          <ChapterHubPage />
        </Suspense>
      </AppShell>
    </>
  )
}
