'use client'

import { useMemo, useState, Fragment } from 'react'
import { Users, UserMinus, AlertTriangle, Percent, Clock, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { useRetentionAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AreaChart from '@/components/analytics/charts/AreaChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function RetentionDashboard() {
  const { data, isLoading, isError, refetch } = useRetentionAnalytics()
  const { data: insights } = useAiInsights('retention')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const retentionCurve = useMemo(() => {
    if (!data) return []
    return [
      { day: 'Day 1', rate: data.day1 },
      { day: 'Day 7', rate: data.day7 },
      { day: 'Day 14', rate: data.day14 },
      { day: 'Day 30', rate: data.day30 },
      { day: 'Day 60', rate: data.day60 },
      { day: 'Day 90', rate: data.day90 },
    ]
  }, [data])

  const heatmapGrouped = useMemo(() => {
    if (!data?.retentionHeatmap) return []
    const map = new Map<string, Array<{ period: string; rate: number }>>()
    for (const cell of data.retentionHeatmap) {
      const existing = map.get(cell.cohort) || []
      existing.push({ period: cell.period, rate: cell.rate })
      map.set(cell.cohort, existing)
    }
    return Array.from(map.entries())
  }, [data?.retentionHeatmap])

  const periods = useMemo(() => {
    if (!data?.retentionHeatmap) return [] as string[]
    return Array.from(new Set(data.retentionHeatmap.map((c) => c.period)))
  }, [data?.retentionHeatmap])

  const recentCohorts = useMemo(() => {
    if (!data?.cohorts) return []
    return data.cohorts.slice(-6)
  }, [data?.cohorts])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'retention', format,
        data: { retentionCurve, cohorts: data?.cohorts, retentionHeatmap: data?.retentionHeatmap },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `retention-analytics.${format}`; a.click()
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
        <KpiCard title="Returned Students" value={data.returnedStudents} icon={Users}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Lost Students" value={data.lostStudents} icon={UserMinus}
          color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
        <KpiCard title="Churn Rate" value={data.churnRate} format="percent" icon={AlertTriangle}
          change={data.churnRate} changeLabel="churn"
          color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-950/30" />
        <KpiCard title="Retention" value={data.retentionPercent} format="percent" icon={Percent}
          change={data.retentionPercent} changeLabel="retention"
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { label: 'Day 1', value: data.day1 },
          { label: 'Day 7', value: data.day7 },
          { label: 'Day 14', value: data.day14 },
          { label: 'Day 30', value: data.day30 },
          { label: 'Day 60', value: data.day60 },
          { label: 'Day 90', value: data.day90 },
        ] as const).map((m) => (
          <Card key={m.label} className="border-border/50 overflow-hidden">
            <div className={cn(
              'h-0.5',
              m.value >= 60 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
              m.value >= 30 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            )} />
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold mt-1">{m.value}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartCard title="Retention Curve" description="Student retention over time" action={<ExportButton onExport={handleExport} />}>
        <AreaChart data={retentionCurve} xKey="day" series={[{ key: 'rate', name: 'Retention Rate', color: '#10b981' }]}
          formatY={(v) => `${v}%`}
          onDotClick={(payload) => {
            const item = payload as { day: string; rate: number }
            setDrillDown({
              title: `Retention: ${item.day}`,
              items: [
                { label: 'Retention Rate', value: item.rate, subtitle: `Period: ${item.day}` },
              ],
            })
          }} />
      </ChartCard>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cohort Retention Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground">Retention rate by cohort and period</p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[600px] p-5 pt-0">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `140px repeat(${periods.length}, 1fr)` }}>
              <div className="text-[10px] text-muted-foreground font-medium p-1.5" />
              {periods.map((period) => (
                <div key={period} className="text-[10px] text-muted-foreground font-medium p-1.5 text-center">{period}</div>
              ))}
              {heatmapGrouped.map(([cohort, cells]) => (
                <Fragment key={cohort}>
                  <div className="text-xs text-muted-foreground p-1.5 truncate">{cohort}</div>
                  {periods.map((period) => {
                    const cell = cells.find((c) => c.period === period)
                    const rate = cell?.rate ?? 0
                    const intensity = Math.min(rate / 100, 1)
                    return (
                      <div key={`${cohort}-${period}`}
                        className="rounded text-center text-xs font-medium p-1.5 transition-colors"
                        style={{ backgroundColor: `rgba(16, 185, 129, ${intensity * 0.85 + 0.05})` }}
                        title={`${cohort} - ${period}: ${rate}%`}
                      >
                        {rate > 0 ? `${Math.round(rate)}%` : '-'}
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {recentCohorts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Cohorts</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[600px] p-5 pt-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs text-muted-foreground font-medium p-2">Cohort</th>
                    {recentCohorts[0]?.periods.map((p) => (
                      <th key={p.period} className="text-right text-xs text-muted-foreground font-medium p-2">{p.period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCohorts.map((cohort) => (
                    <tr key={cohort.cohort} className="border-b border-border/30">
                      <td className="p-2 font-medium">{cohort.cohort}</td>
                      {cohort.periods.map((p) => (
                        <td key={p.period} className="text-right p-2">{p.rate}%</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reactivated Users</p>
              <p className="text-xl font-bold">{data.reactivatedUsers.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lost Students</p>
              <p className="text-xl font-bold">{data.lostStudents.toLocaleString('bn-BD')}</p>
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
