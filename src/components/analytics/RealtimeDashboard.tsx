'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Users, ShoppingCart, UserPlus, CreditCard, BookOpen, FileQuestion, Activity } from 'lucide-react'
import { useRealtimeData } from '@/hooks/use-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatKey = 'currentlyOnline' | 'livePurchases' | 'liveRegistrations' | 'livePayments' | 'liveEnrollments' | 'liveExams'

const statCards: Array<{ key: StatKey; label: string; icon: React.ElementType; gradient: string }> = [
  { key: 'currentlyOnline', label: 'Currently Online', icon: Users, gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'livePurchases', label: 'Purchases Today', icon: ShoppingCart, gradient: 'from-blue-500 to-blue-600' },
  { key: 'liveRegistrations', label: 'New Registrations', icon: UserPlus, gradient: 'from-purple-500 to-purple-600' },
  { key: 'livePayments', label: 'Approved Payments', icon: CreditCard, gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'liveEnrollments', label: 'Enrollments', icon: BookOpen, gradient: 'from-amber-500 to-amber-600' },
  { key: 'liveExams', label: 'Exams Taken', icon: FileQuestion, gradient: 'from-rose-500 to-rose-600' },
]

const eventColors: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  lecture_view: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  purchase: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  exam_start: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  exam_complete: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  signup: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  payment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
}

export default function RealtimeDashboard() {
  const { data, isLoading } = useRealtimeData()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <div>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Live Dashboard</span>
          <p className="text-xs text-muted-foreground">Auto-updates every 15 seconds</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const value = data?.[stat.key]
          return (
            <motion.div
              key={stat.key}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-border/50">
                <div className={cn('h-0.5 bg-gradient-to-r', stat.gradient)} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {stat.key === 'currentlyOnline' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={String(value)}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="text-2xl font-bold"
                    >
                      {isLoading ? '...' : (value ?? 0)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <AnimatePresence>
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
              {(data?.recentActivity ?? []).slice(0, 10).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge variant="secondary" className={cn('text-xs font-normal', eventColors[event.type] || 'bg-muted text-muted-foreground')}>
                    {event.type.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{event.message}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
