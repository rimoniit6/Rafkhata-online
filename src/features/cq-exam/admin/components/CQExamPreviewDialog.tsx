'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, FileQuestion, BookOpen, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, toBengaliNumerals } from '@/lib/utils'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { CQExamSetRecord, CQExamSetQuestionRecord } from '../../types'

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

interface CQExamPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSet: (CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null
}

function PreviewQuestionCard({
  question,
  index,
  collapsed,
  onToggle,
}: {
  question: CQExamSetQuestionRecord
  index: number
  collapsed: boolean
  onToggle: () => void
}) {
  const questionType = question.type || 'cq'
  const isTyped = questionType === 'typed'
  const isNonCq = ['mcq-single', 'mcq-multiple', 'fill-blanks', 'written'].includes(questionType)
  const cq = question.cq

  // Non-CQ question preview
  if (isNonCq) {
    let config: any = {}
    try { config = JSON.parse(question.config || '{}') } catch {}

    const getTypeLabel = () => {
      switch (questionType) {
        case 'mcq-single': return 'MCQ (একক উত্তর)'
        case 'mcq-multiple': return 'MCQ (একাধিক উত্তর)'
        case 'fill-blanks': return 'শূন্যস্থান পূরণ'
        case 'written': return 'রচনামূলক প্রশ্ন'
        default: return questionType
      }
    }

    return (
      <Card className="border-border/50 overflow-hidden shadow-sm">
        <button type="button" onClick={onToggle} className="w-full text-left">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
                {toBengaliNumerals(index + 1)}
              </span>
              <div>
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">{getTypeLabel()}</span>
                <p className="text-xs text-muted-foreground">{question.marks} নম্বর</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{toBengaliNumerals(question.marks)} নম্বর</Badge>
              {collapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}
            </div>
          </div>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {question.stem && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <FileQuestion className="size-4" /> প্রশ্ন
                    </h4>
                    <div className="rounded-lg bg-muted/50 p-4 border">
                      <RichContentRenderer content={question.stem} className="text-base leading-relaxed" />
                    </div>
                    {question.stemImage && (
                      <div className="rounded-lg overflow-hidden border bg-muted/30">
                        <SafeImage src={question.stemImage} alt="প্রশ্নের ছবি" className="max-h-64 object-contain mx-auto" />
                      </div>
                    )}
                  </div>
                )}
                {(questionType === 'mcq-single' || questionType === 'mcq-multiple') && config.options && (
                  <div className="space-y-2">
                    {config.options.map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <span className="size-4 rounded-full border-2 flex items-center justify-center shrink-0" />
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {questionType === 'fill-blanks' && config.blanks && (
                  <div className="space-y-2">
                    {config.blanks.map((blank: any, si: number) => (
                      <div key={si} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <span className="text-sm font-medium text-muted-foreground">{toBengaliNumerals(si + 1)}.</span>
                        <div className="flex-1 px-3 py-2 rounded bg-background border text-sm text-muted-foreground italic">শিক্ষার্থী উত্তর লিখবে...</div>
                        <span className="text-xs text-muted-foreground">{blank.marks} নম্বর</span>
                      </div>
                    ))}
                  </div>
                )}
                {questionType === 'written' && (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6">
                    <p className="text-sm text-muted-foreground/50 italic text-center">শিক্ষার্থী এখানে রচনামূলক উত্তর লিখবে...</p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    )
  }

  // CQ / Typed question preview (existing logic)
  let stimulus = ''
  let stimulusImage: string | null = null
  let subQuestions: { text: string; image: string | null }[] = []

  if (isTyped) {
    stimulus = question.typedUddeepok || ''
    stimulusImage = question.typedUddeepokImage || null
    subQuestions = [
      { text: question.typedQuestion1 || '', image: question.typedQuestion1Image || null },
      { text: question.typedQuestion2 || '', image: question.typedQuestion2Image || null },
      { text: question.typedQuestion3 || '', image: question.typedQuestion3Image || null },
      { text: question.typedQuestion4 || '', image: question.typedQuestion4Image || null },
    ]
  } else if (cq) {
    stimulus = cq.uddeepok
    stimulusImage = cq.uddeepokImage
    subQuestions = [
      { text: cq.question1, image: cq.question1Image },
      { text: cq.question2, image: cq.question2Image },
      { text: cq.question3, image: cq.question3Image },
      { text: cq.question4, image: cq.question4Image },
    ]
  }

  return (
    <Card className="border-border/50 overflow-hidden shadow-sm">
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
              {toBengaliNumerals(index + 1)}
            </span>
            <div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                CQ {toBengaliNumerals(index + 1)}
              </span>
              <p className="text-xs text-muted-foreground">{question.marks} নম্বর</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{toBengaliNumerals(question.marks)} নম্বর</Badge>
            {collapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CardContent className="p-4 sm:p-6 space-y-5">
              {stimulus ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <FileQuestion className="size-4" /> উদ্দীপক
                  </h4>
                  <div className="rounded-lg bg-muted/50 p-4 border">
                    <RichContentRenderer content={stimulus} className="text-base leading-relaxed" />
                  </div>
                  {stimulusImage && (
                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                      <SafeImage src={stimulusImage} alt="উদ্দীপকের ছবি" className="max-h-64 object-contain mx-auto" />
                    </div>
                  )}
                </div>
              ) : null}

              {stimulus ? <Separator /> : null}

              {subQuestions.map((sq, si) => (
                <div key={si} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">{bengaliLabels[si]}</span>
                    <span className="font-semibold text-sm">প্রশ্ন {bengaliLabels[si]}</span>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3 border text-sm leading-relaxed">
                    <RichContentRenderer content={sq.text} />
                  </div>
                  {sq.image && (
                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                      <SafeImage src={sq.image} alt={`প্রশ্ন ${bengaliLabels[si]}-এর ছবি`} className="max-h-48 object-contain mx-auto" />
                    </div>
                  )}
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4">
                    <p className="text-sm text-muted-foreground/50 italic">শিক্ষার্থী এখানে উত্তর লিখবে...</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export function CQExamPreviewDialog({
  open,
  onOpenChange,
  currentSet,
}: CQExamPreviewDialogProps) {
  const questions = currentSet?.questions || []
  const [collapsedCQs, setCollapsedCQs] = useState<Record<string, boolean>>({})

  const handleOpenChange = (open: boolean) => {
    // Reset all to collapsed when opening (except first question)
    if (open) {
      const collapsed: Record<string, boolean> = {}
      questions.forEach((q, i) => {
        collapsed[q.id] = i !== 0
      })
      setCollapsedCQs(collapsed)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="size-5 text-emerald-500" />
              শিক্ষার্থীর দৃষ্টিতে প্রিভিউ
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {currentSet?.title || ''} • {questions.length}টি CQ •{' '}
            {currentSet?.totalMarks || 0} নম্বর • {currentSet?.duration || 0} মিনিট
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">প্রিভিউ করার জন্য কোনো প্রশ্ন নেই</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <PreviewQuestionCard
                key={q.id}
                question={q}
                index={idx}
                collapsed={collapsedCQs[q.id] ?? idx !== 0}
                onToggle={() =>
                  setCollapsedCQs((prev) => ({
                    ...prev,
                    [q.id]: !(prev[q.id] ?? idx !== 0),
                  }))
                }
              />
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between text-xs text-muted-foreground">
          <span>প্রশ্ন {questions.length > 0 ? `১-${toBengaliNumerals(questions.length)}` : '—'}</span>
          <span>মোট {currentSet?.totalMarks || 0} নম্বর</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
