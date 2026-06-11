'use client'

import { memo } from 'react'
import { BookOpen, Play, TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface RecentLecture {
  id: string
  title: string
  subject: string
  chapter?: string
  progress: number
  viewedAt?: string
}

interface LearningSectionProps {
  recentLectures: RecentLecture[]
  onNavigate: (type: string, id: string) => void
}

function LearningSectionComponent({ recentLectures, onNavigate }: LearningSectionProps) {
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/40 dark:to-blue-900/40">
            <TrendingUp className="size-4 text-sky-600 dark:text-sky-400" />
          </div>
          লেখাপড়া চালিয়ে যান
        </h3>
      </div>
      {recentLectures.length === 0 ? (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-400 opacity-40" />
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 flex items-center justify-center mb-4">
              <BookOpen className="size-8 text-sky-400 dark:text-sky-500" />
            </div>
            <p className="font-semibold text-lg">কোনো লেকচার শুরু করেননি</p>
            <p className="text-sm text-muted-foreground mt-1.5">হোম পেজ থেকে লেকচার খুঁজুন</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentLectures.map((lecture) => (
            <Card
              key={lecture.id}
              className="border-0 shadow-md cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
              onClick={() => onNavigate('lecture', lecture.id)}
            >
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <Play className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{lecture.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lecture.subject}{lecture.chapter ? ` › ${lecture.chapter}` : ''}
                  </p>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <Progress value={lecture.progress} className="h-2 flex-1 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500" />
                    <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem] text-right">{lecture.progress}%</span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground shrink-0 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export const LearningSection = memo(LearningSectionComponent)
