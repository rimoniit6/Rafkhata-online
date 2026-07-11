'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryError } from '@/components/admin/QueryError'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import {
  AlignLeft,
  BarChart3,
  BookOpen,
  Clock,
  CreditCard,
  DollarSign,
  FileQuestion,
  UserPlus,
  Users,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { useDashboardStats } from '@/hooks/admin/use-dashboard'

const AdminDashboardCharts = dynamic(() => import('./AdminDashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
      <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
    </div>
  ),
})

const METHOD_LABELS: Record<string, string> = {
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমান',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useRouterStore((s) => s.navigate)
  const { stats, isLoading, isError, error, refetch } = useDashboardStats()

  const statCards = useMemo(() => [
    {
      title: 'মোট ব্যবহারকারী',
      value: stats?.users.total ?? 0,
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'মোট MCQ',
      value: stats?.content.mcqs ?? 0,
      icon: FileQuestion,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
    },
    {
      title: 'মোট CQ',
      value: stats?.content.cqs ?? 0,
      icon: AlignLeft,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
    {
      title: 'মোট লেকচার',
      value: stats?.content.lectures ?? 0,
      icon: BookOpen,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'আয়',
      value: `৳${(stats?.payments.totalRevenue ?? 0).toLocaleString('bn-BD')}`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'পেমেন্ট অপেক্ষমান',
      value: stats?.payments.pending ?? 0,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
  ], [stats])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold">
          স্বাগতম, {user?.name || 'অ্যাডমিন'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          শিক্ষা বাংলা অ্যাডমিন ড্যাশবোর্ডে আপনাকে স্বাগতম
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="animate-fade-in-up">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <AdminDashboardCharts stats={stats ?? null} />

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="animate-fade-in-up">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">সাম্প্রতিক পেমেন্ট</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700"
                  onClick={() => navigate('admin-payments')}
                >
                  সব দেখুন
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ব্যবহারকারী</TableHead>
                    <TableHead>পরিমাণ</TableHead>
                    <TableHead>মেথড</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.recentPayments ?? []).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.user?.name || 'N/A'}</TableCell>
                      <TableCell>৳{payment.amount}</TableCell>
                      <TableCell>{METHOD_LABELS[payment.method] || payment.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'approved'
                              ? 'default'
                              : payment.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            payment.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : payment.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                : ''
                          }
                        >
                          {STATUS_LABELS[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                        কোনো পেমেন্ট নেই
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Content Summary */}
        <div className="animate-fade-in-up">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">কন্টেন্ট সারসংক্ষেপ</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700"
                  onClick={() => navigate('admin-mcq')}
                >
                  বিস্তারিত
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>কন্টেন্ট</TableHead>
                    <TableHead>সংখ্যা</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: 'শ্রেণি', value: stats?.content.classes ?? 0 },
                    { label: 'বিষয়', value: stats?.content.subjects ?? 0 },
                    { label: 'অধ্যায়', value: stats?.content.chapters ?? 0 },
                    { label: 'MCQ', value: stats?.content.mcqs ?? 0 },
                    { label: 'CQ', value: stats?.content.cqs ?? 0 },
                    { label: 'লেকচার', value: stats?.content.lectures ?? 0 },
                  ].map(({ label, value }) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">দ্রুত অ্যাকশন</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'নতুন MCQ', icon: FileQuestion, route: 'admin-mcq' as const },
                { label: 'ব্যবহারকারী', icon: UserPlus, route: 'admin-users' as const },
                { label: 'পেমেন্ট', icon: CreditCard, route: 'admin-payments' as const },
                { label: 'লেকচার', icon: BarChart3, route: 'admin-lectures' as const },
              ].map(({ label, icon: Icon, route }) => (
                <Button
                  key={route}
                  variant="outline"
                  className="h-auto py-3 flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30"
                  onClick={() => navigate(route)}
                >
                  <Icon className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
