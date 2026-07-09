'use client'

import { useMemo } from 'react'
import { Search, TrendingUp, XCircle, Hash, ArrowUpRight } from 'lucide-react'
import { useSearchAnalytics, useAiInsights } from '@/hooks/use-analytics'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import AiInsight from '@/components/analytics/AiInsight'
import AnalyticsEmptyState from '@/components/analytics/AnalyticsEmptyState'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import ExportButton from '@/components/analytics/ExportButton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function SearchDashboard() {
  const { data, isLoading, isError, refetch } = useSearchAnalytics()
  const { data: insights } = useAiInsights('search')

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'search', format, data }),
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `search-analytics.${format}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />
  if (!data) return <AnalyticsEmptyState />

  const totalSearches = data.mostSearched.reduce((acc, s) => acc + s.count, 0)
  const noResultCount = data.noResultSearches.reduce((acc, s) => acc + s.count, 0)

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
        <KpiCard title="Total Searches" value={totalSearches} icon={Search}
          color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard title="No-Result Queries" value={noResultCount} icon={XCircle}
          color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
        <KpiCard title="Unique Keywords" value={data.popularKeywords.length} icon={Hash}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard title="Trending Terms" value={data.trendingSearches.length} icon={TrendingUp}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div>
              <p className="text-sm font-semibold">Top Search Terms</p>
              <p className="text-xs text-muted-foreground mt-0.5">Most frequent search queries</p>
            </div>
            <ExportButton onExport={handleExport} />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.mostSearched.slice(0, 10).map((item, i) => (
                <div key={item.query} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium truncate">{item.query}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">{item.count.toLocaleString('bn-BD')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 border-red-200/50 dark:border-red-900/30">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" />
                No-Result Searches
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Queries with zero results — potential issues</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.noResultSearches.slice(0, 10).map((item, i) => (
                <div key={item.query} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/30 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium truncate">{item.query}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0 ml-2">{item.count.toLocaleString('bn-BD')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold">Popular Keywords</p>
            <p className="text-xs text-muted-foreground mt-0.5">Most searched keywords</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.popularKeywords.slice(0, 20).map((item) => {
                const maxCount = Math.max(...data.popularKeywords.map((k) => k.count), 1)
                const intensity = item.count / maxCount
                return (
                  <span key={item.keyword}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:scale-105',
                      intensity > 0.7 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      intensity > 0.4 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      'bg-muted text-muted-foreground'
                    )}
                  >
                    <Hash className="h-3 w-3" />
                    {item.keyword}
                    <span className="opacity-60">{item.count}</span>
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Trending Searches
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Searches with positive growth</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.trendingSearches.slice(0, 10).map((item) => (
                <div key={item.query} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium truncate">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-semibold text-muted-foreground">{item.count.toLocaleString('bn-BD')}</span>
                    <span className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded-full',
                      item.growth > 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                      item.growth > 20 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      'bg-muted text-muted-foreground'
                    )}>
                      +{item.growth}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
