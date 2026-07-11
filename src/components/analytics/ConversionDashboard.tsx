'use client'

import { useState } from 'react'
import { Users, UserCheck, ShoppingCart, GraduationCap, LogIn, BookOpen, FileQuestion, Award } from 'lucide-react'
import { useConversionFunnel, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent } from '@/components/ui/card'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import FunnelChart from '@/components/analytics/charts/FunnelChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import ExportButton from '@/components/analytics/ExportButton'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function ConversionDashboard() {
  const { data, isLoading, isError, refetch } = useConversionFunnel()
  const { data: insights } = useAiInsights('conversion')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'conversion', format,
        data: { steps: data?.steps, totalVisitors: data?.totalVisitors },
      }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `conversion-analytics.${format}`; a.click()
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
        <KpiCard title="Total Visitors" value={data.totalVisitors} icon={Users}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Total Signups" value={data.totalSignups} icon={UserCheck}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="First Purchase" value={data.totalFirstPurchase} icon={ShoppingCart}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
        <KpiCard title="Course Completed" value={data.totalCourseCompleted} icon={GraduationCap}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
      </div>

      <ChartCard title="Conversion Funnel" description="User journey from visitor to completion" action={<ExportButton onExport={handleExport} />}>
        <FunnelChart data={data.steps}
          onBarClick={(entry) => {
            setDrillDown({
              title: `Funnel Step: ${entry.name}`,
              items: [
                { label: 'Users', value: entry.count },
                { label: 'Conversion Rate', value: entry.conversionRate, subtitle: 'of total visitors' },
                { label: 'Drop Rate', value: entry.dropRate, subtitle: 'from previous step' },
              ],
            })
          }} />
      </ChartCard>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'First Login', value: data.totalFirstLogin, icon: LogIn, color: 'text-sky-600' },
          { label: 'First Lecture', value: data.totalFirstLecture, icon: BookOpen, color: 'text-indigo-600' },
          { label: 'First MCQ', value: data.totalFirstMcq, icon: FileQuestion, color: 'text-violet-600' },
          { label: 'Certificates', value: data.totalCertificates, icon: Award, color: 'text-rose-600' },
        ] as const).map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
              <p className={`text-lg font-bold ${m.color}`}>{m.value.toLocaleString('bn-BD')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Step Conversion Rates</p>
            <div className="space-y-3">
              {data.steps.map((step, i) => (
                <div key={step.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{step.name}</span>
                    <span className="font-medium">{step.conversionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${step.conversionRate}%`,
                        backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'][i] || '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Step Drop Rates</p>
            <div className="space-y-3">
              {data.steps.map((step, i) => (
                <div key={step.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{step.name}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{step.dropRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${step.dropRate}%` }}
                    />
                  </div>
                </div>
              ))}
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
