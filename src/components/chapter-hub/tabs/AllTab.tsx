'use client'

import { Card,CardContent } from '@/components/ui/card'
import type { ChapterData } from '@/hooks/use-chapter-data'
import { ArrowRight,BookOpen,BookOpenCheck,Brain,GraduationCap,HelpCircle,Lightbulb } from 'lucide-react'
import { useMemo } from 'react'

interface AllTabProps {
  chapter: ChapterData
  onNavigate: (tab: string) => void
}

const TYPE_META: Record<string, { icon: React.ElementType; label: string; gradient: string; tab: string }> = {
  lecture: { icon: BookOpen, label: 'Lectures', gradient: 'from-blue-500 to-cyan-500', tab: 'lecture' },
  mcq: { icon: HelpCircle, label: 'MCQ', gradient: 'from-orange-500 to-red-500', tab: 'mcq' },
  cq: { icon: Lightbulb, label: 'CQ', gradient: 'from-violet-500 to-purple-500', tab: 'cq' },
  knowledge: { icon: Brain, label: 'Knowledge Questions', gradient: 'from-pink-500 to-rose-500', tab: 'knowledge' },
  suggestion: { icon: GraduationCap, label: 'Suggestions', gradient: 'from-indigo-500 to-blue-500', tab: 'suggestion' },
  exam: { icon: BookOpenCheck, label: 'Exams', gradient: 'from-teal-500 to-emerald-500', tab: 'exam' },
}

export function AllTab({ chapter, onNavigate }: AllTabProps) {

  const availableTypes = useMemo(() => {
    return Object.entries(TYPE_META).filter(([key]) => {
      const count = chapter.contentCounts[key]
      return count && count > 0
    })
  }, [chapter])

  if (availableTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">This chapter has no learning content available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableTypes.map(([key, meta], i) => {
          const Icon = meta.icon
          const count = chapter.contentCounts[key]
          const freeCount = chapter.freeContentCounts[key]

          return (
            <div
              key={key}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Card
                className="border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer"
                onClick={() => onNavigate(meta.tab)}
              >
                <CardContent className="p-5 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.gradient} shadow-sm`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{meta.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">{count}</span>
                        {freeCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            ({freeCount} free)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
