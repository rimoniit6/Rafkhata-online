'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

export interface Stats {
  users: { total: number; students: number; premium: number; today: number }
  content: { mcqs: number; cqs: number; lectures: number; classes: number; subjects: number; chapters: number }
  payments: { total: number; pending: number; approved: number; totalRevenue: number }
  recentPayments: Array<{
    id: string; amount: number; method: string; status: string; createdAt: string
    user: { id: string; name: string; email: string }
  }>
  monthlyRevenue: Record<string, number>
}

const lineChartConfig: ChartConfig = {
  users: {
    label: 'ব্যবহারকারী',
    color: 'oklch(0.55 0.2 160)',
  },
}

const barChartConfig: ChartConfig = {
  count: {
    label: 'সংখ্যা',
    color: 'oklch(0.55 0.2 160)',
  },
}

interface Props {
  stats: Stats | null
}

export default function AdminDashboardCharts({ stats }: Props) {
  const contentData = useMemo(() => [
    { name: 'MCQ', count: stats?.content.mcqs ?? 0 },
    { name: 'CQ', count: stats?.content.cqs ?? 0 },
    { name: 'লেকচার', count: stats?.content.lectures ?? 0 },
    { name: 'অধ্যায়', count: stats?.content.chapters ?? 0 },
    { name: 'বিষয়', count: stats?.content.subjects ?? 0 },
  ], [stats])

  const revenueChartData = useMemo(
    () => Object.entries(stats?.monthlyRevenue ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([key, value]) => ({
        month: key.slice(5),
        revenue: value,
      })),
    [stats?.monthlyRevenue]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">মাসিক আয়</CardTitle>
          <CardDescription>সর্বশেষ মাসসমূহ</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-64 w-full">
            <LineChart data={revenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.55 0.2 160)"
                strokeWidth={2}
                dot={{ fill: 'oklch(0.55 0.2 160)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">কন্টেন্ট পরিসংখ্যান</CardTitle>
          <CardDescription>বিভিন্ন কন্টেন্টের পরিমাণ</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-64 w-full">
            <BarChart data={contentData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="oklch(0.55 0.2 160)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
