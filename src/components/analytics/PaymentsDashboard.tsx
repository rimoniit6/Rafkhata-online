'use client'

import { useMemo, useState } from 'react'
import { CreditCard, CheckCircle2, XCircle, DollarSign, TrendingUp, Wallet } from 'lucide-react'
import { usePaymentAnalytics, useAiInsights } from '@/hooks/use-analytics'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import BarChart from '@/components/analytics/charts/BarChart'
import DonutChart from '@/components/analytics/charts/DonutChart'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'
import DrillDownModal, { type DrillDownItem } from '@/components/analytics/DrillDownModal'

export default function PaymentsDashboard() {
  const { data, isLoading, isError, refetch } = usePaymentAnalytics()
  const { data: insights } = useAiInsights('payments')
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null)

  const statusData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Approved', value: data.approvedPayments, color: '#10b981' },
      { name: 'Pending', value: data.pendingPayments, color: '#f59e0b' },
      { name: 'Rejected', value: data.rejectedPayments, color: '#ef4444' },
    ]
  }, [data])

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'payments', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `payments-analytics.${format}`; a.click()
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
        <KpiCard title="Pending Payments" value={data.pendingPayments} format="currency" icon={CreditCard}
          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <KpiCard title="Approved Payments" value={data.approvedPayments} format="currency" icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="Rejected Payments" value={data.rejectedPayments} format="currency" icon={XCircle}
          color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniMetric label="Avg Purchase" value={`৳${(data.averagePurchase || 0).toLocaleString('bn-BD')}`} color="text-purple-600" />
        <MiniMetric label="Conversion Rate" value={`${data.conversionRate}%`} color="text-emerald-600" />
        <MiniMetric label="Popular Method" value={data.popularPaymentMethod || 'N/A'} color="text-blue-600" />
        <MiniMetric label="Total Payments" value={(data.approvedPayments + data.pendingPayments + data.rejectedPayments).toLocaleString('bn-BD')} color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Purchases" description="Purchase count per day" action={<ExportButton onExport={handleExport} />}>
          <BarChart data={data.dailyPurchases as unknown as Record<string, unknown>[]} xKey="date" series={[{ key: 'count', name: 'Purchases', color: '#3b82f6' }]} onBarClick={(entry) => setDrillDown({ title: `Purchase - ${String(entry.date)}`, items: (data.dailyPurchases as Array<{ date: string; count: number }>).map((d) => ({ label: d.date, value: d.count, subtitle: 'Daily purchase count' })) })} />
        </ChartCard>
        <ChartCard title="Payment Status" description="Approved vs pending vs rejected">
          <DonutChart data={statusData} formatValue={(v) => `৳${v.toLocaleString('bn-BD')}`} onSliceClick={(entry) => setDrillDown({ title: `${entry.name} - Payment Details`, items: statusData.map((d) => ({ label: d.name, value: d.value, subtitle: `Amount: ৳${d.value.toLocaleString('bn-BD')}` })) })} />
        </ChartCard>
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

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 md:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
