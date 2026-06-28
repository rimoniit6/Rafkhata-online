import type { Metadata } from 'next'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import SubjectHubPage from '@/components/subject-hub/SubjectHubPage'
import { getServerPageMeta } from '@/lib/seo'
import { BreadcrumbSchema, CourseJsonLd } from '@/components/shared/JsonLd'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_NAME = 'শিক্ষা বাংলা'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'

export async function generateMetadata(
  { params }: { params: Promise<{ classSlug: string; subjectSlug: string }> }
): Promise<Metadata> {
  try {
    const { classSlug, subjectSlug } = await params
    const subject = await db.subject.findFirst({
      where: { slug: subjectSlug, class: { slug: classSlug } },
      select: { name: true, description: true, class: { select: { name: true } } },
    })
    if (subject) {
      return {
        title: `${subject.name} - ${subject.class.name} - ${SITE_NAME}`,
        description: subject.description || `${subject.name} - ${subject.class.name} - অধ্যায়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।`,
        openGraph: { title: `${subject.name} - ${subject.class.name} - ${SITE_NAME}`, description: subject.description || `${subject.name} - ${subject.class.name} - অধ্যায়, লেকচার, MCQ ও সৃজনশীল প্রশ্ন দেখুন।` },
      }
    }
    const meta = await getServerPageMeta('subject-detail', { classSlug, subjectSlug })
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
  { params }: { params: Promise<{ classSlug: string; subjectSlug: string }> }
) {
  const { classSlug, subjectSlug } = await params
  const pageUrl = `${SITE_URL}/class/${classSlug}/${subjectSlug}`

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'হোম', url: SITE_URL },
        { name: classSlug, url: `${SITE_URL}/class/${classSlug}` },
        { name: subjectSlug, url: pageUrl },
      ]} />
      <CourseJsonLd
        name={subjectSlug}
        description={`${subjectSlug} - ${classSlug}`}
        url={pageUrl}
      />
      <AppShell>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
          <SubjectHubPage />
        </Suspense>
      </AppShell>
    </>
  )
}
