'use client'

import { useMemo, useState } from 'react'
import { Monitor, Tablet, Smartphone, Globe, Laptop } from 'lucide-react'
import { useDeviceAnalytics, useAiInsights } from '@/hooks/use-analytics'
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

export default function DevicesDashboard() {
  const { data, isLoading, isError, refetch } = useDeviceAnalytics()
  const { data: insights } = useAiInsights('devices')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const deviceData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Desktop', value: data.desktop, color: '#3b82f6' },
      { name: 'Tablet', value: data.tablet, color: '#8b5cf6' },
      { name: 'Mobile', value: data.mobile, color: '#10b981' },
    ]
  }, [data])

  const browserData = useMemo(() => {
    if (!data?.browsers) return []
    return data.browsers.map((b) => ({ name: b.browser, value: b.count, percentage: b.percentage }))
  }, [data])

  const osData = useMemo(() => {
    if (!data?.os) return []
    return data.os.map((o) => ({ name: o.os, value: o.count, percentage: o.percentage }))
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'devices', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `devices-analytics.${format}`; a.click()
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
        <KpiCard title="Desktop" value={data.desktop} icon={Monitor}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Tablet" value={data.tablet} icon={Tablet}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
        <KpiCard title="Mobile" value={data.mobile} icon={Smartphone}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Device Distribution" description="Desktop, tablet, and mobile share" action={<ExportButton onExport={handleExport} />}>
          <DonutChart data={deviceData} formatValue={(v) => `${((v / (data.desktop + data.tablet + data.mobile)) * 100).toFixed(1)}%`} onSliceClick={(entry) => setDrillDown({ title: `${entry.name} - Device Details`, items: deviceData.map((d) => ({ label: d.name, value: d.value, subtitle: `${((d.value / (data.desktop + data.tablet + data.mobile)) * 100).toFixed(1)}% of total` })) })} />
        </ChartCard>
        <ChartCard title="Browser Distribution" description="Usage by browser">
          <BarChart data={browserData as unknown as Record<string, unknown>[]} xKey="name" series={[{ key: 'value', name: 'Users', color: '#3b82f6' }]} />
        </ChartCard>
        <ChartCard title="OS Distribution" description="Usage by operating system">
          <BarChart data={osData as unknown as Record<string, unknown>[]} xKey="name" series={[{ key: 'value', name: 'Users', color: '#8b5cf6' }]} />
        </ChartCard>
      </div>

      {drillDown && (
        <DrillDownModal
          open={!!drillDown}
          onClose={() => setDrillDown(null)}
          title={drillDown.title}
          items={drillDown.items}
          formatValue={(v) => `${((v / (data.desktop + data.tablet + data.mobile)) * 100).toFixed(1)}%`}
        />
      )}
    </div>
  )
}
