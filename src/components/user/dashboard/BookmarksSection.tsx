'use client'

import { memo } from 'react'
import { Bookmark, FileQuestion, BookOpen, FileText, Zap, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

interface BookmarkedQuestion {
  id: string
  contentId: string
  text: string
  type: string
}

interface BookmarksSectionProps {
  bookmarkedQuestions: BookmarkedQuestion[]
  onNavigate: (type: string, id: string) => void
  onDelete: (id: string, type: string) => void
  onExplore: () => void
}

function BookmarksSectionComponent({ bookmarkedQuestions, onNavigate, onDelete, onExplore }: BookmarksSectionProps) {
  return (
    <div className="mt-5 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/40">
          <Bookmark className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        সেভ করা প্রশ্ন
      </h3>
      {bookmarkedQuestions.length === 0 ? (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 opacity-40" />
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 flex items-center justify-center mb-4">
              <Bookmark className="size-8 text-amber-400 dark:text-amber-500" />
            </div>
            <p className="font-semibold text-lg">কোনো কন্টেন্ট সেভ করেননি</p>
            <p className="text-sm text-muted-foreground mt-1.5">পড়ার সময় বুকমার্ক বাটন দিয়ে সেভ করুন</p>
            <Button className="mt-4 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={onExplore}>
              <Zap className="size-4" />
              কন্টেন্ট খুঁজুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {bookmarkedQuestions.map((q, idx) => {
            const config: Record<string, { icon: typeof FileQuestion; label: string; color: string }> = {
              mcq: { icon: FileQuestion, label: 'MCQ', color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' },
              cq: { icon: BookOpen, label: 'সৃজনশীল প্রশ্ন', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
              lecture: { icon: FileText, label: 'লেকচার', color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400' },
              'board-mcq': { icon: FileQuestion, label: 'MCQ', color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' },
              'board-cq': { icon: BookOpen, label: 'সৃজনশীল প্রশ্ন', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
              suggestion: { icon: FileText, label: 'সাজেশন', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
              exam: { icon: FileText, label: 'পরীক্ষা', color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
              'mcq-exam-package': { icon: FileText, label: 'এক্সাম প্যাকেজ', color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
              bundle: { icon: FileText, label: 'বান্ডেল', color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
            }
            const fallback = { icon: FileText, label: 'কন্টেন্ট', color: 'bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400' }
            const { icon: ContentIcon, label: typeLabel, color: typeColor } = config[q.type] || fallback
            return (
              <Card key={q.id || idx} className="border-0 shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg shrink-0', typeColor)}>
                    <ContentIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => onNavigate(q.type, q.contentId)}>
                    <div className="text-sm font-medium line-clamp-2"><RichContentRenderer content={q.text} /></div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">{typeLabel}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => onDelete(q.contentId, q.type)}
                  >
                    <XCircle className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const BookmarksSection = memo(BookmarksSectionComponent)
