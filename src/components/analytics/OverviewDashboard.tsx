'use client'

import { DollarSign, Users, CreditCard, TrendingUp, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useRevenueAnalytics, useStudentAnalytics, useAlerts } from '@/hooks/use-analytics'
import { useRouterStore } from '@/store/router'

export default function OverviewDashboard() {
  const { data: revenue } = useRevenueAnalytics()
  const { data: students } = useStudentAnalytics()
  const { data: alerts } = useAlerts()
  const navigate = useRouterStore((s) => s.navigate)

  const cards = [
    {
      title: 'Total Revenue',
      value: revenue ? `৳${(revenue.totalRevenue || 0).toLocaleString('bn-BD')}` : '—',
      change: revenue?.revenueGrowth,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      route: 'admin-analytics-revenue' as const,
    },
    {
      title: 'Total Students',
      value: students ? (students.totalStudents || 0).toLocaleString('bn-BD') : '—',
      change: students?.studentGrowthRate,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      route: 'admin-analytics-students' as const,
    },
    {
      title: 'Revenue Today',
      value: revenue ? `৳${(revenue.revenueToday || 0).toLocaleString('bn-BD')}` : '—',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-700 dark:text-purple-300',
      route: 'admin-analytics-revenue' as const,
    },
    {
      title: 'Pending Payments',
      value: revenue?.pendingRevenue ? `৳${revenue.pendingRevenue.toLocaleString('bn-BD')}` : '0',
      icon: CreditCard,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      route: 'admin-analytics-payments' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              onClick={() => navigate(card.route)}
              className="group text-left"
            >
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-border/50">
                <div className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                  'bg-gradient-to-br', card.color
                )} style={{ opacity: 0.03 }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                      <p className="text-2xl md:text-3xl font-bold tracking-tight">{card.value}</p>
                      {card.change !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded-full',
                            card.change >= 0
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          )}>
                            {card.change >= 0 ? '+' : ''}{card.change}%
                          </span>
                          <span className="text-xs text-muted-foreground">vs prev period</span>
                        </div>
                      )}
                    </div>
                    <div className={cn('p-3 rounded-xl', card.bg)}>
                      <Icon className={cn('h-5 w-5', card.textColor)} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    View details
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      {alerts && alerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Active Alerts</span>
            </div>
            <div className="space-y-1.5">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                  {alert.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverviewMetricCard
          title="DAU"
          value={students?.dailyActiveUsers ?? 0}
          subtitle="Daily Active Users"
          color="from-emerald-500 to-emerald-600"
        />
        <OverviewMetricCard
          title="WAU"
          value={students?.weeklyActiveUsers ?? 0}
          subtitle="Weekly Active Users"
          color="from-blue-500 to-blue-600"
        />
        <OverviewMetricCard
          title="MAU"
          value={students?.monthlyActiveUsers ?? 0}
          subtitle="Monthly Active Users"
          color="from-purple-500 to-purple-600"
        />
        <OverviewMetricCard
          title="Engagement"
          value={students?.engagementScore ?? 0}
          subtitle="Student Engagement Score"
          suffix="%"
          color="from-amber-500 to-amber-600"
        />
      </div>
    </div>
  )
}

function OverviewMetricCard({
  title,
  value,
  subtitle,
  suffix = '',
  color,
}: {
  title: string
  value: number
  subtitle: string
  suffix?: string
  color: string
}) {
  return (
    <Card className="overflow-hidden border-border/50">
      <div className={cn('h-1 bg-gradient-to-r', color)} />
      <CardContent className="p-5">
        <p className="text-3xl font-bold">{value.toLocaleString('bn-BD')}{suffix}</p>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
