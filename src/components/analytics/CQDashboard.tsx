'use client'

import { useMemo, useState } from 'react'
import { FileText, BarChart3, CheckCircle2, XCircle, Clock, Users } from 'lucide-react'
import { useCqAnalytics, useAiInsights } from '@/hooks/use-analytics'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import DonutChart from '@/components/analytics/charts/DonutChart'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function CQDashboard() {
  const { data, isLoading, isError, refetch } = useCqAnalytics()
  const { data: insights } = useAiInsights('cq')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const passFailData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Pass', value: data.passRate, color: '#10b981' },
      { name: 'Fail', value: data.failRate, color: '#ef4444' },
    ]
  }, [data])

  const reviewStatusData = useMemo(() => {
    if (!data) return []
    const reviewed = data.totalSubmissions - data.pendingReview
    return [
      { name: 'Reviewed', value: Math.max(reviewed, 0), color: '#10b981' },
      { name: 'Pending Review', value: data.pendingReview, color: '#f59e0b' },
    ]
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'cq', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `cq-analytics.${format}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />
  if (!data) return <AnalyticsEmptyState />

  const reviewTimeHours = data.teacherReviewTime > 0 ? (data.teacherReviewTime / 60).toFixed(1) : '0'

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
        <KpiCard title="Total Submissions" value={data.totalSubmissions} icon={FileText}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Average Marks" value={data.averageMarks} format="percent" icon={BarChart3}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Pending Review" value={data.pendingReview} icon={Clock}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniMetric label="Pass Rate" value={`${data.passRate}%`} color="text-emerald-600" />
        <MiniMetric label="Fail Rate" value={`${data.failRate}%`} color="text-red-600" />
        <MiniMetric label="Review Time" value={`${reviewTimeHours}h`} color="text-indigo-600" />
        <MiniMetric label="Reviewed" value={`${Math.max(data.totalSubmissions - data.pendingReview, 0)}`} color="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Pass vs Fail" description="Submission pass/fail distribution" action={<ExportButton onExport={handleExport} />}>
          <DonutChart data={passFailData} formatValue={(v) => `${v}%`} onSliceClick={(entry) => setDrillDown({ title: `${entry.name} - Submission Breakdown`, items: passFailData.map((d) => ({ label: d.name, value: d.value, subtitle: `${d.value}% of submissions` })) })} />
        </ChartCard>
        <ChartCard title="Review Status" description="Reviewed vs pending submissions">
          <DonutChart data={reviewStatusData} />
        </ChartCard>
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

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 md:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
