'use client'

import { useMemo, useState } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Users, CreditCard, ArrowUpRight, Banknote, PiggyBank } from 'lucide-react'
import { useRevenueAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent } from '@/components/ui/card'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AreaChart from '@/components/analytics/charts/AreaChart'
import BarChart from '@/components/analytics/charts/BarChart'
import DonutChart from '@/components/analytics/charts/DonutChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function RevenueDashboard() {
  const { data, isLoading, isError, refetch } = useRevenueAnalytics()
  const { data: insights } = useAiInsights('revenue')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const revenueChartSeries = useMemo(() => [
    { key: 'revenue', name: 'Revenue', color: '#10b981' },
    { key: 'movingAvg', name: '7-Day Avg', color: '#3b82f6' },
  ], [])

  const topSourcesSeries = useMemo(() =>
    (data?.topSources || []).map((s) => ({ name: s.source, value: s.revenue })),
  [data?.topSources]
  )

  const revenueByMethodSeries = useMemo(() =>
    (data?.revenueByMethod || []).map((m) => ({
      name: m.method.charAt(0).toUpperCase() + m.method.slice(1),
      value: m.revenue,
    })),
  [data?.revenueByMethod]
  )

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'revenue', format,
        data: { totalRevenue: data?.totalRevenue, revenueByMethod: data?.revenueByMethod, dailyRevenue: data?.dailyRevenue, monthlyRevenue: data?.monthlyRevenue, topSources: data?.topSources },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `revenue-analytics.${format}`; a.click()
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
        <KpiCard title="Total Revenue" value={data.totalRevenue} format="currency" icon={DollarSign}
          change={data.revenueGrowth} changeLabel="vs prev period"
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Revenue Today" value={data.revenueToday} format="currency" icon={TrendingUp}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Avg Order Value" value={data.averageOrderValue} format="currency" icon={ShoppingCart}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
        <KpiCard title="Revenue Per Student" value={data.revenuePerStudent} format="currency" icon={Users}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricMini label="Pending" value={`৳${(data.pendingRevenue || 0).toLocaleString('bn-BD')}`} color="text-orange-600" />
        <MetricMini label="Approved" value={`৳${(data.approvedRevenue || 0).toLocaleString('bn-BD')}`} color="text-emerald-600" />
        <MetricMini label="This Month" value={`৳${(data.revenueThisMonth || 0).toLocaleString('bn-BD')}`} color="text-indigo-600" />
        <MetricMini label="Last Month" value={`৳${(data.revenueLastMonth || 0).toLocaleString('bn-BD')}`} color="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Trend" description="Daily revenue with 7-day moving average" action={<ExportButton onExport={handleExport} />}>
          <AreaChart data={data.revenueTrend} xKey="date" series={revenueChartSeries}
            formatY={(v) => `৳${v.toLocaleString('bn-BD')}`} />
        </ChartCard>
        <ChartCard title="Revenue Forecast" description="Next 3 months projection">
          <AreaChart data={data.revenueForecast} xKey="month"
            series={[{ key: 'predicted', name: 'Predicted', color: '#10b981' }, { key: 'upper', name: 'Upper Bound', color: '#3b82f6' }]}
            formatY={(v) => `৳${v.toLocaleString('bn-BD')}`} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Revenue by Source">
          <DonutChart data={topSourcesSeries} formatValue={(v) => `৳${v.toLocaleString('bn-BD')}`}
            onSliceClick={(entry) => {
              const source = data?.topSources.find((s) => s.source === entry.name)
              if (source) {
                let items: DrillDownItem[] = []
                if (source.source === 'Lecture' && data?.revenueByLecture) items = data.revenueByLecture.map((l) => ({ label: l.title, value: l.revenue, subtitle: `${l.count} purchases` }))
                else if (source.source === 'Course' && data?.revenueByCourse) items = data.revenueByCourse.map((c) => ({ label: c.title, value: c.revenue, subtitle: `${c.count} purchases` }))
                else if (source.source === 'Exam' && data?.revenueByExam) items = data.revenueByExam.map((e) => ({ label: e.title, value: e.revenue, subtitle: `${e.count} purchases` }))
                else if (source.source === 'Bundle' && data?.revenueByBundle) items = data.revenueByBundle.map((b) => ({ label: b.title, value: b.revenue, subtitle: `${b.count} purchases` }))
                else if (source.source === 'Suggestion' && data?.revenueBySuggestion) items = data.revenueBySuggestion.map((s) => ({ label: s.title, value: s.revenue, subtitle: `${s.count} purchases` }))
                else items = data?.revenueByCourse?.map((c) => ({ label: c.title, value: c.revenue })) ?? []
                if (items.length > 0) setDrillDown({ title: `Revenue by ${source.source}`, items })
              }
            }}
          />
        </ChartCard>
        <ChartCard title="Revenue by Method">
          <DonutChart data={revenueByMethodSeries} formatValue={(v) => `৳${v.toLocaleString('bn-BD')}`}
            onSliceClick={(entry) => {
              const items: DrillDownItem[] = data?.revenueByMethod?.filter((m) => m.method.charAt(0).toUpperCase() + m.method.slice(1) === entry.name).map((m) => ({ label: m.method, value: m.revenue, subtitle: `${m.count} transactions` })) ?? []
              if (items.length > 0) setDrillDown({ title: `${entry.name} Payments`, items })
            }}
          />
        </ChartCard>
        <ChartCard title="Monthly Revenue">
          <BarChart data={data.monthlyRevenue} xKey="month" series={[{ key: 'revenue', name: 'Revenue', color: '#10b981' }]}
            formatY={(v) => `৳${v.toLocaleString('bn-BD')}`} />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold">Revenue Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue distribution by day and hour</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground text-center font-medium mb-1">{day}</span>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = data.heatmap.find((h) => h.day === day && h.hour === hour)
                  const revenue = cell?.revenue || 0
                  const maxRevenue = Math.max(...data.heatmap.map((h) => h.revenue), 1)
                  const intensity = Math.min(revenue / maxRevenue, 1)
                  return (
                    <div key={hour}
                      className="rounded-sm transition-colors"
                      style={{ backgroundColor: `rgba(16, 185, 129, ${intensity})`, height: '10px' }}
                      title={`${day} ${hour}:00 - ৳${revenue.toLocaleString('bn-BD')}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {drillDown && (
        <DrillDownModal
          open={!!drillDown}
          onClose={() => setDrillDown(null)}
          title={drillDown.title}
          items={drillDown.items}
          formatValue={(v) => `৳${v.toLocaleString('bn-BD')}`}
        />
      )}
    </div>
  )
}

function MetricMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 md:p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
