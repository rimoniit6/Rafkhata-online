'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, HelpCircle, Target, Brain, BarChart3, Award, AlertTriangle } from 'lucide-react'
import { useMcqAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import DonutChart from '@/components/analytics/charts/DonutChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'

export default function MCQDashboard() {
  const { data, isLoading, isError, refetch } = useMcqAnalytics()
  const { data: insights } = useAiInsights('mcq')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const scoreDistribution = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Correct', value: data.correctPercent, color: '#10b981' },
      { name: 'Wrong', value: data.wrongPercent, color: '#ef4444' },
      { name: 'Skipped', value: data.skippedPercent, color: '#f59e0b' },
    ]
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'mcq', format,
        data: {
          questionsSolved: data?.questionsSolved, accuracy: data?.accuracy,
          mostDifficult: data?.mostDifficult, mostEasy: data?.mostEasy,
        },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `mcq-analytics.${format}`; a.click()
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
        <KpiCard title="Questions Solved" value={data.questionsSolved} icon={Brain}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Accuracy" value={data.accuracy} format="percent" icon={Target}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Average Score" value={data.averageScore} format="percent" icon={BarChart3}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
        <KpiCard title="Correct Rate" value={data.correctPercent} format="percent" icon={Award}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Score Distribution" description="Correct vs Wrong vs Skipped" action={<ExportButton onExport={handleExport} />}>
          <DonutChart data={scoreDistribution} formatValue={(v) => `${v}%`} onSliceClick={(entry) => setDrillDown({ title: `${entry.name} - Score Breakdown`, items: scoreDistribution.map((d) => ({ label: d.name, value: d.value, subtitle: `${d.value}% of total` })) })} />
        </ChartCard>

        <div className="grid grid-cols-1 gap-3">
          <Card className="border-border/50 border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Most Easy Question</p>
                  <p className="text-sm font-medium mt-1 truncate" title={data.mostEasy.question}>{data.mostEasy.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-emerald-600 font-semibold">{data.mostEasy.correctRate}% correct rate</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Most Difficult Question</p>
                  <p className="text-sm font-medium mt-1 truncate" title={data.mostDifficult.question}>{data.mostDifficult.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-red-600 font-semibold">{data.mostDifficult.wrongRate}% wrong rate</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { label: 'Correct', value: data.correctPercent, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', barColor: 'bg-emerald-500' },
          { label: 'Wrong', value: data.wrongPercent, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', barColor: 'bg-red-500' },
          { label: 'Skipped', value: data.skippedPercent, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', barColor: 'bg-amber-500' },
        ] as const).map((m) => (
          <Card key={m.label} className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', m.bg, m.color)}>{m.value}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', m.barColor)} style={{ width: `${m.value}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-xl font-bold">{data.averageScore}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questions Solved</p>
              <p className="text-xl font-bold">{data.questionsSolved.toLocaleString('bn-BD')}</p>
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
          formatValue={(v) => `${v}%`}
        />
      )}
    </div>
  )
}
