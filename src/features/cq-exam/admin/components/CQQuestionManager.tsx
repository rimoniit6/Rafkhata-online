'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { Skeleton } from '@/components/ui/skeleton'
import { CQExamSetQuestionRecord,CQExamSetRecord } from '@/features/cq-exam/types'
import { ArrowLeft,BookOpen,ChevronDown,ChevronUp,Edit,Eye,FileQuestion,Pencil,Plus,Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { CQExamPreviewDialog } from './CQExamPreviewDialog'

interface CQQuestionManagerProps {
  loading: boolean
  currentSet: (CQExamSetRecord & { questions?: CQExamSetQuestionRecord[] }) | null
  onBack: () => void
  onOpenAddQuestion: () => void
  onOpenCreateQuestion: () => void
  onEditQuestion?: (question: CQExamSetQuestionRecord) => void
  onRemoveQuestion: (id: string, isTyped: boolean) => void
  onMoveQuestion: (id: string, direction: 'up' | 'down') => void
  onUpdateQuestionMarks?: (questionId: string, marks: number) => void
}

const _bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

function parseSubMarks(subMarks: number[] | null | undefined): number[] {
  return Array.isArray(subMarks) ? subMarks : []
}

export function CQQuestionManager({
  loading, currentSet, onBack, onOpenAddQuestion, onOpenCreateQuestion,
  onEditQuestion, onRemoveQuestion, onMoveQuestion, onUpdateQuestionMarks: _onUpdateQuestionMarks
}: CQQuestionManagerProps) {
  const questions = currentSet?.questions || []
  const [_editingMarks, _setEditingMarks] = useState<Record<string, string>>({})
  const [_marksSaving, _setMarksSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">প্রশ্ন ব্যবস্থাপনা</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentSet?.title || ''} • {questions.length}টি CQ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {questions.length > 0 && (
              <Button variant="outline" className="gap-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4" /> প্রিভিউ
              </Button>
            )}
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={onOpenCreateQuestion}>
              <Pencil className="h-4 w-4" /> টাইপ করে যোগ করুন
            </Button>
            <Button className="gap-2 bg-sky-600 hover:bg-sky-700" size="sm" onClick={onOpenAddQuestion}>
              <Plus className="h-4 w-4" /> ব্যাংক থেকে যোগ করুন
            </Button>
          </div>
        </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{questions.length}</p>
              <p className="text-xs text-muted-foreground">মোট CQ</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{currentSet?.totalMarks || 0}</p>
              <p className="text-xs text-muted-foreground">মোট নম্বর</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <FileQuestion className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো CQ প্রশ্ন নেই</p>
          <p className="text-sm text-muted-foreground mt-1">উপরে থাকা বাটন ব্যবহার করে প্রশ্ন যোগ করুন</p>
        </div>
      ) : (
        <div className="space-y-4">
            {questions.map((q, idx) => {
            const subMarks = parseSubMarks(q.subMarks)
            const questionType = q.type || 'cq'
            const isTyped = questionType === 'typed'
            const isNonCq = ['mcq-single', 'mcq-multiple', 'fill-blanks', 'written'].includes(questionType)

            if (isNonCq) {
              const config: any = q.config || {}

              const getTypeLabel = () => {
                switch (questionType) {
                  case 'mcq-single': return 'MCQ (একক)'
                  case 'mcq-multiple': return 'MCQ (একাধিক)'
                  case 'fill-blanks': return 'শূন্যস্থান'
                  case 'written': return 'রচনামূলক'
                  default: return questionType
                }
              }

              return (
                <Card key={q.id} className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 px-4 py-2.5 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">Q {idx + 1}</Badge>
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30">{getTypeLabel()}</Badge>
                      <span className="text-xs text-muted-foreground">নম্বর: {q.marks}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {onEditQuestion && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-600" onClick={() => onEditQuestion(q)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => onMoveQuestion(q.id, 'up')}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === questions.length - 1} onClick={() => onMoveQuestion(q.id, 'down')}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onRemoveQuestion(q.id, true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    {q.stem && <RichContentRenderer content={q.stem} className="text-sm mb-2" inline />}
                    {q.stemImage && <Image src={q.stemImage} alt="প্রশ্ন" width={96} height={48} className="h-12 rounded object-contain" unoptimized />}
                    {questionType === 'fill-blanks' && config.blanks && (
                      <div className="text-xs text-muted-foreground">{config.blanks.length}টি শূন্যস্থান</div>
                    )}
                    {questionType !== 'fill-blanks' && config.options && (
                      <div className="text-xs text-muted-foreground">{config.options.length}টি অপশন</div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            let stimulus = ''
            let stimulusImage: string | null = null
            let subQuestions: { label: string; value: string; image: string | null }[] = []

            if (isTyped) {
              stimulus = q.typedUddeepok || ''
              stimulusImage = q.typedUddeepokImage || null
              subQuestions = [
                { label: 'প্রশ্ন ১', value: q.typedQuestion1 || '', image: q.typedQuestion1Image || null },
                { label: 'প্রশ্ন ২', value: q.typedQuestion2 || '', image: q.typedQuestion2Image || null },
                { label: 'প্রশ্ন ৩', value: q.typedQuestion3 || '', image: q.typedQuestion3Image || null },
                { label: 'প্রশ্ন ৪', value: q.typedQuestion4 || '', image: q.typedQuestion4Image || null },
              ]
            } else if (q.cq) {
              stimulus = q.cq.uddeepok
              stimulusImage = q.cq.uddeepokImage
              subQuestions = [
                { label: 'প্রশ্ন ১', value: q.cq.question1, image: q.cq.question1Image },
                { label: 'প্রশ্ন ২', value: q.cq.question2, image: q.cq.question2Image },
                { label: 'প্রশ্ন ৩', value: q.cq.question3, image: q.cq.question3Image },
                { label: 'প্রশ্ন ৪', value: q.cq.question4, image: q.cq.question4Image },
              ]
            }

            return (
              <Card key={q.id} className="border-border/50 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/80 dark:from-sky-950/20 dark:to-blue-950/20 px-4 py-2.5 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">CQ {idx + 1}</Badge>
                    {isTyped && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">টাইপকৃত</Badge>}
                    <span className="text-xs text-muted-foreground">নম্বর: {q.marks}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {isTyped && onEditQuestion && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-600" onClick={() => onEditQuestion(q)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => onMoveQuestion(q.id, 'up')}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === questions.length - 1} onClick={() => onMoveQuestion(q.id, 'down')}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onRemoveQuestion(isTyped ? q.id : q.cqId!, isTyped)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  {stimulus ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 mb-1">
                        <BookOpen className="h-3 w-3" /> উদ্দীপক
                      </div>
                      <RichContentRenderer content={stimulus} className="text-sm" inline />
                      {stimulusImage && <Image src={stimulusImage} alt="উদ্দীপক" width={96} height={48} className="h-12 mt-1 rounded object-contain" unoptimized />}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subQuestions.map((item, qIdx) => (
                      <div key={qIdx} className="p-2 rounded border bg-muted/30">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
                          {subMarks[qIdx] !== undefined && (
                            <span className="text-[10px] font-bold text-emerald-600">{subMarks[qIdx]} নম্বর</span>
                          )}
                        </div>
                        <RichContentRenderer content={item.value} className="text-sm line-clamp-2" inline />
                        {item.image && <Image src={item.image} alt={item.label} width={64} height={32} className="h-8 mt-1 rounded" unoptimized />}
                      </div>
                    ))}
                  </div>
                  {!isTyped && q.cq?.chapter && (
                    <div className="text-xs text-muted-foreground">অধ্যায়: {q.cq.chapter.name}</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>

    <CQExamPreviewDialog
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      currentSet={currentSet}
    />
  </>
  )
}
