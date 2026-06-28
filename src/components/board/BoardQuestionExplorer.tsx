'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useBoardFilterStore } from '@/store/board-filters'
import { useBoardQuestionsData } from '@/hooks/use-board-questions-data'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useAccessStatus } from '@/hooks/use-access-status'
import { useStats } from '@/hooks/use-stats'
import { useIsMobile } from '@/hooks/use-mobile'

import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'

import { ExplorerHeader } from './explorer/ExplorerHeader'
import { ExplorerSearch } from './explorer/ExplorerSearch'
import { QuickFilters } from './explorer/QuickFilters'
import { CoreFilterBar } from './explorer/CoreFilterBar'
import { FilterChips } from './explorer/FilterChips'
import { ResultsAnalytics } from './explorer/ResultsAnalytics'
import { McqViewMode } from './explorer/McqViewMode'
import { CqViewMode } from './explorer/CqViewMode'
import { EmptyExplorer } from './explorer/EmptyExplorer'
import { ExplorerSkeleton } from './explorer/ExplorerSkeleton'
import { ConversionBanner } from './explorer/ConversionBanner'
import { SelectClassPrompt } from './explorer/SelectClassPrompt'

import type { BoardQuestionItem } from '@/types/board-questions'

type QuestionTab = 'mcq' | 'cq'

export default function BoardQuestionExplorer() {
  const { navigate } = useRouterStore()
  const { user } = useAuthStore()
  const metadata = useHierarchyMetadata()
  const isMobile = useIsMobile()
  const setLabelMap = useBoardFilterStore((s) => s.setLabelMap)
  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const boards = useBoardFilterStore((s) => s.boards)
  const years = useBoardFilterStore((s) => s.years)
  const subjects = useBoardFilterStore((s) => s.subjects)
  const chapters = useBoardFilterStore((s) => s.chapters)
  const difficulty = useBoardFilterStore((s) => s.difficulty)
  const topics = useBoardFilterStore((s) => s.topics)
  const status = useBoardFilterStore((s) => s.status)
  const contentAccess = useBoardFilterStore((s) => s.contentAccess)

  const [tab, setTab] = useState<QuestionTab>('mcq')
  const [mcqPage, setMcqPage] = useState(1)
  const [cqPage, setCqPage] = useState(1)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
    classLevel?: string
  } | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const filterSignature = useMemo(
    () => [
      classLevels.join(','),
      boards.join(','),
      years.join(','),
      subjects.join(','),
      chapters.join(','),
      difficulty.join(','),
      topics.join(','),
      status.join(','),
      contentAccess,
    ].join('|'),
    [classLevels, boards, years, subjects, chapters, difficulty, topics, status, contentAccess],
  )

  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setMcqPage(1)
      setCqPage(1)
    }, 0)
    return () => window.clearTimeout(resetId)
  }, [filterSignature])

  const handleTabChange = useCallback((value: string) => {
    setTab(value as QuestionTab)
  }, [])

  const hasClassSelected = classLevels.length > 0

  const {
    questions: mcqQuestions,
    analytics: mcqAnalytics,
    isLoading: mcqLoading,
    error: mcqError,
    pagination: mcqPagination,
    refetch: mcqRefetch,
  } = useBoardQuestionsData(hasClassSelected ? mcqPage : 1, 10, 'mcq')

  const {
    questions: cqQuestions,
    analytics: cqAnalytics,
    isLoading: cqLoading,
    error: cqError,
    pagination: cqPagination,
    refetch: cqRefetch,
  } = useBoardQuestionsData(hasClassSelected ? cqPage : 1, 10, 'cq')

  const mcqAccessMap = useAccessStatus(hasClassSelected ? mcqQuestions : [])
  const cqAccessMap = useAccessStatus(hasClassSelected ? cqQuestions : [])

  const analytics = tab === 'mcq' ? mcqAnalytics : cqAnalytics
  const isLoading = tab === 'mcq' ? mcqLoading : cqLoading

  const { data: stats } = useStats()

  const totalQuestions = analytics.totalQuestions || 12500
  const recentAdded = analytics.totalQuestions || 240

  const scrollToResults = useCallback(() => {
    if (isMobile) return
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isMobile])

  const handleUnlock = useCallback((q: BoardQuestionItem) => {
    if (!user) { navigate('login'); return }
    setPurchaseModalData({
      contentType: tab === 'mcq' ? 'board-mcq' : 'board-cq',
      contentId: q.id,
      contentTitle: `${metadata.getBoardName(q.board)} - ${q.year} (${tab.toUpperCase()})`,
      contentPrice: q.price,
      classLevel: q.classLevel,
    })
    setPurchaseModalOpen(true)
  }, [navigate, user, metadata, tab])

  const accessibleMcqs = useMemo(
    () => mcqQuestions.filter((q) => mcqAccessMap[q.id]?.accessType === 'free' || mcqAccessMap[q.id]?.accessType === 'purchased'),
    [mcqQuestions, mcqAccessMap],
  )

  const handlePracticeAll = useCallback(() => {
    const mcq = accessibleMcqs[0]
    if (!mcq) return
    navigate('board-questions', { boardName: mcq.board, year: mcq.year, classLevel: mcq.classLevel })
  }, [accessibleMcqs, navigate])

  // Seed label maps from hierarchy metadata
  useEffect(() => {
    if (metadata.classOptions.length > 0) {
      setLabelMap('classLevels', Object.fromEntries(metadata.classOptions.map((o) => [o.value, o.label])))
    }
    if (metadata.boardOptions.length > 0) {
      setLabelMap('boards', Object.fromEntries(metadata.boardOptions.map((o) => [o.value, o.label])))
    }
    if (metadata.yearLabels.length > 0) {
      setLabelMap('years', Object.fromEntries(metadata.yearLabels.map((y) => [y, y])))
    }
    if (metadata.subjects.length > 0) {
      setLabelMap('subjects', Object.fromEntries(metadata.subjects.map((s) => [s.id, s.name])))
    }
  }, [metadata.classOptions, metadata.boardOptions, metadata.yearLabels, metadata.subjects, setLabelMap])

  const showConversionBanner = hasClassSelected && !mcqLoading && mcqAnalytics.totalQuestions > mcqAnalytics.accessibleQuestions

  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader totalQuestions={totalQuestions} recentAdded={recentAdded} activeStudents={stats?.students ?? 0} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-4 sm:py-6">
          <ExplorerSearch />
        </div>

        <div className="pb-3">
          <QuickFilters />
        </div>

        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6">
          <CoreFilterBar />
        </div>

        <div className="py-2">
          <FilterChips />
        </div>

        <AnimatePresence mode="wait">
          {!hasClassSelected && (
            <motion.div
              key="select-class"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SelectClassPrompt />
            </motion.div>
          )}

          {hasClassSelected && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {showConversionBanner && (
                <div className="py-2">
                  <ConversionBanner
                    totalQuestions={mcqAnalytics.totalQuestions}
                    accessibleQuestions={mcqAnalytics.accessibleQuestions}
                    premiumQuestions={mcqAnalytics.premiumQuestions}
                  />
                </div>
              )}

              <div ref={resultsRef} className="py-4 space-y-4">
                <ResultsAnalytics data={analytics} isLoading={isLoading} />

                {/* MCQ / CQ Tabs */}
                <Tabs value={tab} onValueChange={handleTabChange}>
                  <TabsList>
                    <TabsTrigger value="mcq" className="gap-2">
                      MCQ
                      {mcqPagination.total > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {mcqPagination.total}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="cq" className="gap-2">
                      CQ (সৃজনশীল)
                      {cqPagination.total > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {cqPagination.total}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mcq" className="mt-4">
                    {mcqLoading && !mcqQuestions.length && <ExplorerSkeleton />}
                    {hasClassSelected && !mcqLoading && mcqQuestions.length === 0 && <EmptyExplorer />}
                    {mcqError && !mcqLoading && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-destructive mb-2">Failed to load questions</p>
                        <Button variant="outline" size="sm" onClick={() => mcqRefetch()} className="rounded-xl">
                          Try Again
                        </Button>
                      </div>
                    )}
                    {hasClassSelected && mcqQuestions.length > 0 && (
                      <McqViewMode
                        questions={mcqQuestions}
                        accessMap={mcqAccessMap}
                        page={mcqPage}
                        totalPages={mcqPagination.totalPages}
                        total={mcqPagination.total}
                        onPageChange={(p) => { setMcqPage(p); scrollToResults() }}
                        onPracticeAll={handlePracticeAll}
                        onUnlock={handleUnlock}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="cq" className="mt-4">
                    {cqLoading && !cqQuestions.length && <ExplorerSkeleton />}
                    {hasClassSelected && !cqLoading && cqQuestions.length === 0 && <EmptyExplorer />}
                    {cqError && !cqLoading && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-destructive mb-2">Failed to load questions</p>
                        <Button variant="outline" size="sm" onClick={() => cqRefetch()} className="rounded-xl">
                          Try Again
                        </Button>
                      </div>
                    )}
                    {hasClassSelected && cqQuestions.length > 0 && (
                      <CqViewMode
                        questions={cqQuestions}
                        accessMap={cqAccessMap}
                        page={cqPage}
                        totalPages={cqPagination.totalPages}
                        total={cqPagination.total}
                        onPageChange={(p) => { setCqPage(p); scrollToResults() }}
                        onUnlock={handleUnlock}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {purchaseModalData && (
        <PurchaseOptionsModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          contentType={purchaseModalData.contentType}
          contentId={purchaseModalData.contentId}
          contentTitle={purchaseModalData.contentTitle}
          contentPrice={purchaseModalData.contentPrice}
          classLevel={purchaseModalData.classLevel}
        />
      )}
    </div>
  )
}
