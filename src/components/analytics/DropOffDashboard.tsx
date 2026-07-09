'use client'

import { useMemo, useState } from 'react'
import { LogOut, BookOpen, CreditCard, Ban, FileQuestion, Flag, Lightbulb, Clock, AlertTriangle } from 'lucide-react'
import { useDropOffAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function DropOffDashboard() {
  const { data, isLoading, isError, refetch } = useDropOffAnalytics()
  const { data: insights } = useAiInsights('dropoff')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const exitStages = useMemo(() => {
    if (!data) return []
    const stages = [
      { key: 'After Login', rate: data.exitAfterLogin.rate, avgTime: data.exitAfterLogin.avgTime },
      { key: 'After Lecture', rate: data.exitAfterLecture.rate, avgTime: data.exitAfterLecture.avgTime },
      { key: 'Before Purchase', rate: data.exitBeforePurchase.rate, avgTime: data.exitBeforePurchase.avgTime },
      { key: 'During Payment', rate: data.exitDuringPayment.rate, avgTime: data.exitDuringPayment.avgTime },
      { key: 'During Exam', rate: data.exitDuringExam.rate, avgTime: data.exitDuringExam.avgTime },
      { key: 'Before Completion', rate: data.exitBeforeCompletion.rate, avgTime: data.exitBeforeCompletion.avgTime },
    ]
    return stages
  }, [data])

  const stageIcons = [
    { icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { icon: Ban, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { icon: FileQuestion, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { icon: Flag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ]

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'dropoff', format,
        data: { exitStages },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dropoff-analytics.${format}`; a.click()
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exitStages.map((stage, i) => (
          <KpiCard key={stage.key}
            title={`Exit: ${stage.key}`}
            value={stage.rate}
            format="percent"
            icon={stageIcons[i]?.icon}
            color={stageIcons[i]?.color}
            bg={stageIcons[i]?.bg}
          />
        ))}
      </div>

      <ChartCard title="Exit Rate by Stage" description="Percentage of users dropping off at each stage" action={<ExportButton onExport={handleExport} />}>
        <BarChart data={exitStages} xKey="key" series={[{ key: 'rate', name: 'Exit Rate', color: '#ef4444' }]}
          formatY={(v) => `${v}%`}
          onBarClick={(payload) => {
            const item = payload as { key: string; rate: number; avgTime: number }
            setDrillDown({
              title: `Drop-off: ${item.key}`,
              items: [
                { label: 'Exit Rate', value: item.rate, subtitle: `${item.avgTime}s avg time before exit` },
              ],
            })
          }} />
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Time Spent Before Exit</CardTitle>
            <p className="text-xs text-muted-foreground">Average time (seconds) users spend before leaving</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {exitStages.map((stage, i) => {
              const Icon = stageIcons[i]?.icon || Clock
              const maxTime = Math.max(...exitStages.map((s) => s.avgTime), 1)
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded-lg shrink-0', stageIcons[i]?.bg)}>
                    <Icon className={cn('h-4 w-4', stageIcons[i]?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-muted-foreground truncate">{stage.key}</span>
                      <span className="font-medium tabular-nums">{stage.avgTime}s</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400 transition-all"
                        style={{ width: `${(stage.avgTime / maxTime) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Improvement Suggestions</p>
          {data.suggestions.map((suggestion, i) => (
            <Card key={i} className="border-border/50 border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase">{suggestion.stage}</span>
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Reason:</span> {suggestion.reason}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      → {suggestion.improvement}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
