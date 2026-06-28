'use client'

import { useState } from 'react'
import { Users, UserPlus, Activity, Clock, Zap } from 'lucide-react'
import { useStudentAnalytics, useAiInsights } from '@/hooks/use-analytics'
import { Card, CardContent } from '@/components/ui/card'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AreaChart from '@/components/analytics/charts/AreaChart'
import BarChart from '@/components/analytics/charts/BarChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function StudentDashboard() {
  const { data, isLoading, isError, refetch } = useStudentAnalytics()
  const { data: insights } = useAiInsights('students')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

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
        <KpiCard title="Total Students" value={data.totalStudents} icon={Users}
          change={data.studentGrowthRate} changeLabel="growth rate"
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="New Students" value={data.newStudents} icon={UserPlus}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Engagement Score" value={data.engagementScore} format="percent" icon={Zap}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <KpiCard title="Avg Study Time" value={data.averageStudyTime > 0 ? `${Math.round(data.averageStudyTime / 60)}m` : '0m'} icon={Clock}
          subtitle="per student" color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { label: 'DAU', value: data.dailyActiveUsers },
          { label: 'WAU', value: data.weeklyActiveUsers },
          { label: 'MAU', value: data.monthlyActiveUsers },
        ] as const).map((m) => (
          <Card key={m.label} className="border-border/50 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold mt-1">{m.value.toLocaleString('bn-BD')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Active Users" description="Unique users per day">
          <AreaChart data={data.dau} xKey="date" series={[{ key: 'count', name: 'Active Users', color: '#10b981' }]} />
        </ChartCard>
        <ChartCard title="Weekly Active Users">
          <AreaChart data={data.wau} xKey="week" series={[{ key: 'count', name: 'Active Users', color: '#8b5cf6' }]} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly Active Users">
          <AreaChart data={data.mau} xKey="month" series={[{ key: 'count', name: 'Active Users', color: '#f59e0b' }]} />
        </ChartCard>
        <ChartCard title="Student Growth" description="Monthly new students">
          <BarChart data={data.growth} xKey="month" series={[{ key: 'newStudents', name: 'New Students', color: '#3b82f6' }]} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Most Active Time</p>
            <p className="text-xl font-bold mt-1">{data.mostActiveTime || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Most Active Day</p>
            <p className="text-xl font-bold mt-1">{data.mostActiveDay || 'N/A'}</p>
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
