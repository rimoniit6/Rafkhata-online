'use client'

import { useMemo, useState } from 'react'
import { Clock, PlayCircle, Bookmark, FileText, MessageSquare, Download, Eye, TrendingUp, Video } from 'lucide-react'
import { useLectureAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function LecturesDashboard() {
  const { data, isLoading, isError, refetch } = useLectureAnalytics()
  const { data: insights } = useAiInsights('lectures')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const watchTimeFormatted = useMemo(() => formatTime(data?.averageWatchTime ?? 0), [data?.averageWatchTime])

  const engagementCards = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Total Bookmarks', value: data.totalBookmarks, icon: Bookmark, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
      { label: 'Total Notes', value: data.totalNotes, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
      { label: 'AI Chat Usage', value: data.aiChatUsage, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
      { label: 'Total Downloads', value: data.totalDownloads, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    ]
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'lectures', format,
        data: {
          mostViewed: data?.mostViewed, averageWatchTime: data?.averageWatchTime,
          completionPercent: data?.completionPercent, engagementCards,
        },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `lectures-analytics.${format}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />
  if (!data) return <AnalyticsEmptyState />

  return (
    <div className="space-y-8">
      {insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <AiInsight key={insight.id} type={insight.type} title={insight.title} description={insight.description} action={insight.action} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Avg Watch Time" value={watchTimeFormatted} icon={Clock}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Completion Rate" value={data.completionPercent} format="percent" icon={PlayCircle}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Drop-Off Time" value={formatTime(data.dropOffTime)} icon={Video}
          color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
        <KpiCard title="AI Chat Usage" value={data.aiChatUsage} icon={MessageSquare}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {engagementCards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('p-1.5 rounded-lg', card.bg)}>
                  <card.icon className={cn('h-3.5 w-3.5', card.color)} />
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
              <p className={cn('text-lg font-bold mt-1', card.color)}>
                {card.value.toLocaleString('bn-BD')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Watch Time Distribution" description="Average watch time vs completion threshold" action={<ExportButton onExport={handleExport} />}>
          <div className="h-full flex flex-col justify-center px-4 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Average Watch Time</span>
                <span className="font-medium">{watchTimeFormatted}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min((data.averageWatchTime / 1800) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{(data.averageWatchTime / 60).toFixed(1)} min of 30 min target</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Drop-Off Time</span>
                <span className="font-medium">{formatTime(data.dropOffTime)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all"
                  style={{ width: `${Math.min((data.dropOffTime / 1800) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Students typically drop off at {formatTime(data.dropOffTime)}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{data.completionPercent}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${data.completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </ChartCard>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Most Viewed Lecture</p>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={data.mostViewed.title}>{data.mostViewed.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{data.mostViewed.views.toLocaleString('bn-BD')}</span>
                    <span>views</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>Highest engagement lecture in the catalog</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Bookmarks</p>
              <p className="text-xl font-bold">{data.totalBookmarks.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Notes</p>
              <p className="text-xl font-bold">{data.totalNotes.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {drillDown && (
        <DrillDownModal
          open={!!drillDown}
          onClose={() => setDrillDown(null)}
          title={drillDown.title}
          items={drillDown.items}
        />
      )}
    </div>
  )
}
