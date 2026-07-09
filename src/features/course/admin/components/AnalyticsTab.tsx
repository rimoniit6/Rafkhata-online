'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Users, CreditCard, Layers, Video, Monitor, FileQuestion, PenSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  totalEnrollments: number
  revenue: number
  contentCount: number
  contentByType: Record<string, number>
  totalLessons: number
  liveClasses: number
  recordedClasses: number
  totalExams: number
  totalAssignments: number
}

interface Props { courseId: string }

export default function AnalyticsTab({ courseId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [courseId])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses?action=analytics&id=${courseId}`)
      const json = await res.json()
      setStats(json.data?.stats || json.stats || null)
    } catch { setStats(null) } finally { setLoading(false) }
  }

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>

  const summaryCards = [
    { label: 'মোট এনরোলমেন্ট', value: stats?.totalEnrollments || 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'মোট আয়', value: `৳${(stats?.revenue || 0).toLocaleString('bn-BD')}`, icon: CreditCard, color: 'text-green-600 bg-green-100' },
    { label: 'মোট ক্লাস', value: stats?.totalLessons || 0, icon: Video, color: 'text-purple-600 bg-purple-100' },
    { label: 'মোট কন্টেন্ট', value: stats?.contentCount || 0, icon: Layers, color: 'text-rose-600 bg-rose-100' },
  ]

  const breakdownCards = [
    { label: 'লাইভ ক্লাস', value: stats?.liveClasses || 0, icon: Monitor, color: 'text-blue-600 bg-blue-100' },
    { label: 'রেকর্ডেড ক্লাস', value: stats?.recordedClasses || 0, icon: BookOpen, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'পরীক্ষা', value: stats?.totalExams || 0, icon: FileQuestion, color: 'text-amber-600 bg-amber-100' },
    { label: 'অ্যাসাইনমেন্ট', value: stats?.totalAssignments || 0, icon: PenSquare, color: 'text-orange-600 bg-orange-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(item => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {breakdownCards.map(item => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.contentByType && Object.keys(stats.contentByType).length > 0 && (
        <Card>
          <CardHeader><CardTitle>কন্টেন্ট টাইপ অনুযায়ী বিতরণ</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.contentByType).map(([type, count]) => {
                const pct = stats.contentCount > 0 ? Math.round((count / stats.contentCount) * 100) : 0
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-32 text-sm font-medium">{type}</span>
                    <div className="flex-1 rounded-full bg-muted h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">{count}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
