'use client'

import {
Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,
BreadcrumbPage,BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { ChapterData } from '@/hooks/use-chapter-data'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useRouterStore, useRouteParams } from '@/store/router'
import { BookOpen } from 'lucide-react'

interface ChapterHeaderProps {
  chapter: ChapterData
}

export function ChapterHeader({ chapter }: ChapterHeaderProps) {
  const params = useRouteParams()
  const navigate = useRouterStore((s) => s.navigate)
  const { getClassName } = useHierarchyMetadata()

  const className = chapter.className || getClassName(params.classSlug || '') || chapter.classSlug

  return (
    <div className="animate-fade-in-up">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('class-detail', { classSlug: chapter.classSlug })}>
              {className}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('subject-detail', { classSlug: chapter.classSlug, subjectId: chapter.subjectId })}>
              {chapter.subjectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{chapter.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{chapter.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {chapter.subjectName} — {className}
          </p>
        </div>
      </div>
    </div>
  )
}
