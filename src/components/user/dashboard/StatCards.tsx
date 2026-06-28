import { memo } from 'react'
import { BookOpen, BarChart3, Bookmark, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface StatCardsProps {
  stats: {
    completedLectures: number
    totalLectures: number
    avgMcqScore: number
    savedQuestions: number
  }
  approvedPaymentsCount: number
  onPurchasedClick: () => void
}

function StatCardsComponent({ stats, approvedPaymentsCount, onPurchasedClick }: StatCardsProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in"
    >
      <div className="animate-fade-in-up delay-100">
        <Card className="border-0 shadow-lg shadow-emerald-500/5 overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center h-[9rem] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-60" />
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 mb-2.5 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.completedLectures}</p>
            <p className="text-xs text-muted-foreground mt-0.5">সম্পন্ন লেকচার</p>
            <div className="mt-auto w-full">
              <Progress value={stats.totalLectures > 0 ? (stats.completedLectures / stats.totalLectures) * 100 : 0} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up delay-200">
        <Card className="border-0 shadow-lg shadow-teal-500/5 overflow-hidden group hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300">
          <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center h-[9rem] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500 opacity-60" />
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 mb-2.5 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{stats.avgMcqScore}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">MCQ স্কোর</p>
            <div className="mt-auto w-full">
              <Progress value={stats.avgMcqScore} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up delay-300">
        <Card className="border-0 shadow-lg shadow-amber-500/5 overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
          <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center h-[9rem] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-60" />
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 mb-2.5 group-hover:scale-110 transition-transform duration-300">
              <Bookmark className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats.savedQuestions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">সেভ করা প্রশ্ন</p>
            <div className="mt-auto w-full">
              <Progress value={Math.min(stats.savedQuestions * 10, 100)} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up delay-400">
        <Card className="border-0 shadow-lg shadow-purple-500/5 overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 active:scale-[0.98]" onClick={onPurchasedClick}>
          <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center h-[9rem] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-violet-400 to-teal-400 opacity-60" />
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 mb-2.5 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{approvedPaymentsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">মোট ক্রয়</p>
            <div className="mt-auto w-full">
              <Progress value={Math.min(approvedPaymentsCount * 20, 100)} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-violet-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const StatCards = memo(StatCardsComponent)
