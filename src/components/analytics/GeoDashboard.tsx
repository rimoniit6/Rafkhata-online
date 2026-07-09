'use client'

import { useMemo, useState } from 'react'
import { Globe, MapPin, Building2, Layers } from 'lucide-react'
import { useGeoAnalytics, useAiInsights } from '@/hooks/use-analytics'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function GeoDashboard() {
  const { data, isLoading, isError, refetch } = useGeoAnalytics()
  const { data: insights } = useAiInsights('geo')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const totalCountries = data?.countries?.reduce((acc, c) => acc + c.count, 0) || 0
  const totalDivisions = data?.divisions?.reduce((acc, d) => acc + d.count, 0) || 0
  const totalDistricts = data?.districts?.reduce((acc, d) => acc + d.count, 0) || 0

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'geo', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `geo-analytics.${format}`; a.click()
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
        <KpiCard title="Countries" value={data.countries.length} icon={Globe}
          subtitle={`${totalCountries.toLocaleString('bn-BD')} total users`}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Divisions" value={data.divisions.length} icon={MapPin}
          subtitle={`${totalDivisions.toLocaleString('bn-BD')} total users`}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Districts" value={data.districts.length} icon={Building2}
          subtitle={`${totalDistricts.toLocaleString('bn-BD')} total users`}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div>
              <p className="text-sm font-semibold">Country Distribution</p>
              <p className="text-xs text-muted-foreground mt-0.5">Users by country</p>
            </div>
            <ExportButton onExport={handleExport} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.countries.slice(0, 10).map((item) => (
                <GeoBar key={item.country} label={item.country} count={item.count} percentage={item.percentage} total={totalCountries} onClick={() => setDrillDown({ title: 'Country Distribution', items: data.countries.map((c) => ({ label: c.country, value: c.count, subtitle: `${c.percentage.toFixed(1)}% of total users`, metadata: { percentage: c.percentage } })) })} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold">Division / State Distribution</p>
            <p className="text-xs text-muted-foreground mt-0.5">Users by division or state</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.divisions.slice(0, 10).map((item) => (
                <GeoBar key={item.division} label={item.division} count={item.count} percentage={item.percentage} total={totalDivisions} onClick={() => setDrillDown({ title: 'Division / State Distribution', items: data.divisions.map((d) => ({ label: d.division, value: d.count, subtitle: `${d.percentage.toFixed(1)}% of total users`, metadata: { percentage: d.percentage } })) })} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold">District / City Distribution</p>
          <p className="text-xs text-muted-foreground mt-0.5">Users by district or city</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.districts.slice(0, 15).map((item) => (
              <GeoBar key={item.district} label={item.district} count={item.count} percentage={item.percentage} total={totalDistricts} onClick={() => setDrillDown({ title: 'District / City Distribution', items: data.districts.map((d) => ({ label: d.district, value: d.count, subtitle: `${d.percentage.toFixed(1)}% of total users`, metadata: { percentage: d.percentage } })) })} />
            ))}
          </div>
        </CardContent>
      </Card>

      {drillDown && (
        <DrillDownModal
          open={!!drillDown}
          onClose={() => setDrillDown(null)}
          title={drillDown.title}
          items={drillDown.items}
          formatValue={(v) => v.toLocaleString('bn-BD')}
        />
      )}
    </div>
  )
}

function GeoBar({ label, count, percentage, total, onClick }: { label: string; count: number; percentage: number; total: number; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-3 py-1.5" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="text-sm font-medium w-32 md:w-40 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-muted-foreground w-16 text-right tabular-nums">{count.toLocaleString('bn-BD')}</span>
      <span className="text-xs text-muted-foreground w-12 text-right">{percentage.toFixed(1)}%</span>
    </div>
  )
}
