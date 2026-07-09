'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Star, BookOpen, DollarSign, BarChart3, LineChart } from 'lucide-react'
import { useCourseAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AreaChart from '@/components/analytics/charts/AreaChart'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function CoursesDashboard() {
  const { data, isLoading, isError, refetch } = useCourseAnalytics()
  const { data: insights } = useAiInsights('courses')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'courses', format,
        data: {
          mostPopular: data?.mostPopular, leastPopular: data?.leastPopular,
          highestRevenue: data?.highestRevenue, revenuePerCourse: data?.revenuePerCourse,
        },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `courses-analytics.${format}`; a.click()
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
        <KpiCard title="Avg Progress" value={data.averageProgress} format="percent" icon={TrendingUp}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Avg Rating" value={data.averageRating} icon={Star}
          subtitle="out of 5" format="number"
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <KpiCard title="Highest Completion" value={data.highestCompletion.rate} format="percent" icon={TrendingUp}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Lowest Completion" value={data.lowestCompletion.rate} format="percent" icon={TrendingDown}
          color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CourseMiniCard label="Most Popular" title={data.mostPopular.title} value={data.mostPopular.enrollments} suffix="enrollments"
          icon={BookOpen} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <CourseMiniCard label="Least Popular" title={data.leastPopular.title} value={data.leastPopular.enrollments} suffix="enrollments"
          icon={TrendingDown} color="text-red-600" bg="bg-red-50 dark:bg-red-950/30" />
        <CourseMiniCard label="Highest Revenue" title={data.highestRevenue.title} value={data.highestRevenue.revenue} suffix="revenue"
          icon={DollarSign} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/30" />
        <CourseMiniCard label="Highest Completion" title={data.highestCompletion.title} value={data.highestCompletion.rate} suffix="%"
          icon={Star} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Enrollment Trend" description="Course enrollments over time" action={<ExportButton onExport={handleExport} />}>
          <AreaChart data={data.enrollmentTrend} xKey="date" series={[{ key: 'count', name: 'Enrollments', color: '#3b82f6' }]} />
        </ChartCard>
        <ChartCard title="Completion Trend" description="Course completions over time">
          <AreaChart data={data.completionTrend} xKey="date" series={[{ key: 'count', name: 'Completions', color: '#10b981' }]} />
        </ChartCard>
      </div>

      <ChartCard title="Revenue per Course" description="Total revenue generated by each course">
        <BarChart data={data.revenuePerCourse} xKey="title" series={[{ key: 'revenue', name: 'Revenue', color: '#f59e0b' }]}
          formatY={(v) => `৳${v.toLocaleString('bn-BD')}`}
          onBarClick={(payload) => {
            const item = payload as { title: string; revenue: number; enrollments?: number }
            setDrillDown({
              title: `Revenue: ${item.title}`,
              items: [
                { label: 'Revenue', value: item.revenue, subtitle: item.enrollments ? `${item.enrollments} enrollments` : undefined },
              ],
            })
          }} />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Lowest Completion</p>
            <p className="text-sm font-medium truncate">{data.lowestCompletion.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Rate: {data.lowestCompletion.rate}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Least Popular</p>
            <p className="text-sm font-medium truncate">{data.leastPopular.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{data.leastPopular.enrollments} enrollments</p>
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

function CourseMiniCard({
  label, title, value, suffix, icon: Icon, color, bg,
}: {
  label: string; title: string; value: number; suffix: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={cn('p-1.5 rounded-lg', bg)}>
            <Icon className={cn('h-3.5 w-3.5', color)} />
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-sm font-medium truncate" title={title}>{title}</p>
        <p className={cn('text-lg font-bold mt-1', color)}>
          {typeof value === 'number' ? value.toLocaleString('bn-BD') : value}
          <span className="text-xs text-muted-foreground ml-1 font-normal">{suffix}</span>
        </p>
      </CardContent>
    </Card>
  )
}
