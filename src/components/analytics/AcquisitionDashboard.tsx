'use client'

import { useMemo, useState } from 'react'
import { Chrome, Mail, Share2, Globe, Megaphone, Users } from 'lucide-react'
import { useAcquisitionAnalytics, useAiInsights } from '@/hooks/use-analytics'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import DonutChart from '@/components/analytics/charts/DonutChart'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'
import { Card, CardContent } from '@/components/ui/card'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function AcquisitionDashboard() {
  const { data, isLoading, isError, refetch } = useAcquisitionAnalytics()
  const { data: insights } = useAiInsights('acquisition')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const signupSourceData = useMemo(() => {
    if (!data?.signupSource) return []
    return data.signupSource.map((s) => ({
      name: s.source.charAt(0).toUpperCase() + s.source.slice(1),
      value: s.count,
      percentage: s.percentage,
    }))
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'acquisition', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `acquisition-analytics.${format}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />
  if (!data) return <AnalyticsEmptyState />

  const sources = [
    { label: 'Google Login', value: data.googleLogin, icon: Chrome, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Email Signup', value: data.emailSignup, icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Referral', value: data.referral, icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Organic', value: data.organic, icon: Globe, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Campaign', value: data.campaign, icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ]

  const totalSignups = sources.reduce((acc, s) => acc + s.value, 0)

  return (
    <div className="space-y-8">
      {insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <AiInsight key={insight.id} type={insight.type} title={insight.title} description={insight.description} action={insight.action} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sources.map((s) => {
          const Icon = s.icon
          const pct = totalSignups > 0 ? ((s.value / totalSignups) * 100).toFixed(1) : '0'
          return (
            <KpiCard key={s.label} title={s.label} value={s.value} icon={Icon}
              subtitle={`${pct}% of total`}
              color={s.color} bg={s.bg} />
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Signup Sources" description="Distribution by acquisition channel" action={<ExportButton onExport={handleExport} />}>
          <DonutChart data={signupSourceData} formatValue={(v) => `${((v / totalSignups) * 100).toFixed(1)}%`} onSliceClick={(entry) => setDrillDown({ title: `${entry.name} - Signup Details`, items: signupSourceData.map((d) => ({ label: d.name, value: d.value, subtitle: `${((d.value / totalSignups) * 100).toFixed(1)}% of total` })) })} />
        </ChartCard>
        <ChartCard title="Source Comparison" description="Signup count by source">
          <BarChart data={signupSourceData} xKey="name" series={[{ key: 'value', name: 'Signups', color: '#3b82f6' }]} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {sources.map((s) => {
          const pct = totalSignups > 0 ? ((s.value / totalSignups) * 100).toFixed(1) : '0'
          return (
            <Card key={s.label} className="border-border/50 overflow-hidden">
              <div className="h-1" style={{ backgroundColor: s.color.replace('text-', '') === 'blue-600' ? '#2563eb' : s.color.replace('text-', '') === 'emerald-600' ? '#059669' : s.color.replace('text-', '') === 'purple-600' ? '#9333ea' : s.color.replace('text-', '') === 'amber-600' ? '#d97706' : '#e11d48' }} />
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{pct}%</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {drillDown && (
        <DrillDownModal
          open={!!drillDown}
          onClose={() => setDrillDown(null)}
          title={drillDown.title}
          items={drillDown.items}
          formatValue={(v) => `${((v / totalSignups) * 100).toFixed(1)}%`}
        />
      )}
    </div>
  )
}
