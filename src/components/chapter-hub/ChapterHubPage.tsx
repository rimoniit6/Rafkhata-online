'use client'

import { useEffect, useState } from 'react'

import { useChapterData } from '@/hooks/use-chapter-data'
import { useRouterStore, useRouteParams } from '@/store/router'
import { ChapterHeader } from './ChapterHeader'
import { ChapterSkeleton } from './ChapterSkeleton'
import { ChapterStats } from './ChapterStats'
import { ChapterTabs } from './ChapterTabs'
import { AllTab } from './tabs/AllTab'
import { CqTab } from './tabs/CqTab'
import { ExamsTab } from './tabs/ExamsTab'
import { KnowledgeQuestionsTab } from './tabs/KnowledgeQuestionsTab'
import { LecturesTab } from './tabs/LecturesTab'
import { McqTab } from './tabs/McqTab'
import { SuggestionsTab } from './tabs/SuggestionsTab'

export default function ChapterHubPage() {
  const params = useRouteParams()
  const chapterId = params.chapterId
  const { data: chapter, isLoading, error } = useChapterData(chapterId)
  const [activeTab, setActiveTab] = useState('all')

  // Set initial tab from params (if coming from content chip click) or reset on chapter change
  useEffect(() => {
    setActiveTab(params.initialTab || 'all')
  }, [chapterId, params.initialTab])

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive mb-2">Failed to load chapter data</p>
          <p className="text-sm text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading || !chapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ChapterSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="animate-fade-in">
        {/* Header */}
        <ChapterHeader chapter={chapter} />

        {/* Stats */}
        <ChapterStats chapter={chapter} />

        {/* Tabs */}
        <div className="mt-6 sticky top-14 z-30 bg-background/95 backdrop-blur-sm pb-2">
          <ChapterTabs chapter={chapter} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'all' && <AllTab chapter={chapter} onNavigate={setActiveTab} />}
          {activeTab === 'lecture' && <LecturesTab chapterId={chapter.id} />}
          {activeTab === 'mcq' && <McqTab chapterId={chapter.id} />}
          {activeTab === 'cq' && <CqTab chapterId={chapter.id} />}
          {activeTab === 'knowledge' && <KnowledgeQuestionsTab chapterId={chapter.id} />}
          {activeTab === 'suggestion' && <SuggestionsTab chapterId={chapter.id} />}
          {activeTab === 'exam' && <ExamsTab chapterId={chapter.id} />}
        </div>
      </div>
    </div>
  )
}
