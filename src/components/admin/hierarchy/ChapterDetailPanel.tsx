import { AlignLeft, FileQuestion } from 'lucide-react'
import type { ChapterCountItem, ChapterItem } from './types'

interface ChapterDetailPanelProps {
  chapter: ChapterItem
  counts?: ChapterCountItem
  showLegend: boolean
}

export function ChapterDetailPanel({ chapter, counts, showLegend }: ChapterDetailPanelProps) {
  return (
    <>
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        {chapter._count && (
          <>
            {counts ? (
              <>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <FileQuestion className="h-2.5 w-2.5" />
                  MCQ: <span className="font-semibold">{counts.mcqFree}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{counts.mcqPremium}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 dark:text-teal-400">
                  <AlignLeft className="h-2.5 w-2.5" />
                  CQ: <span className="font-semibold">{counts.cqFree}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{counts.cqPremium}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                  {chapter._count.lectures} লেকচার
                </span>
              </>
            ) : (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                {chapter._count.mcqs} MCQ · {chapter._count.cqs} CQ · {chapter._count.lectures} লেকচার
              </span>
            )}
          </>
        )}
      </div>
      {chapter._count && counts && showLegend && (
        <div className="flex items-center gap-2 px-4 pb-1.5 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ফ্রি</span>
          <span className="inline-flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> প্রিমিয়াম</span>
          <span>(ফ্রি / প্রিমিয়াম)</span>
        </div>
      )}
    </>
  )
}
